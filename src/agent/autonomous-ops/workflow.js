import crypto from 'node:crypto';

const TERMINAL = new Set(['completed', 'failed', 'blocked', 'review_failed']);
const MAX_STEPS = 12;
const MAX_RETRIES = 2;

function requiredText(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`);
  return value.trim();
}
function clone(value) { return structuredClone(value); }
function now() { return new Date().toISOString(); }

function event(task, type, detail = {}) {
  task.events.push({
    sequence: task.events.length + 1,
    eventId: crypto.randomUUID(),
    type,
    at: now(),
    detail: clone(detail)
  });
}

async function persist(store, task, type, detail = {}) {
  event(task, type, detail);
  await store.save(clone(task));
  return task;
}

/**
 * Deterministic, adapter-driven multi-agent workflow kernel.
 *
 * The kernel does not call an LLM or execute arbitrary tools itself.
 * Planner, executor, reviewer and persistence are injected capabilities.
 * Production deployments must use a durable store and idempotent tool adapters.
 */
export async function runAutonomousTask(input, adapters, options = {}) {
  const taskId = requiredText(input?.taskId || crypto.randomUUID(), 'taskId');
  const idempotencyKey = requiredText(input?.idempotencyKey, 'idempotencyKey');
  const objective = requiredText(input?.objective, 'objective');
  const store = adapters?.store;
  const planner = adapters?.planner;
  const executor = adapters?.executor;
  const reviewer = adapters?.reviewer;
  const approvalVerifier = adapters?.approvalVerifier;

  for (const [name, value] of Object.entries({ store, planner, executor, reviewer })) {
    if (!value) throw new Error(`missing adapter: ${name}`);
  }
  for (const method of ['getByIdempotencyKey', 'save']) {
    if (typeof store[method] !== 'function') throw new Error(`store.${method} must be a function`);
  }
  if (typeof planner.plan !== 'function') throw new Error('planner.plan must be a function');
  if (typeof executor.execute !== 'function') throw new Error('executor.execute must be a function');
  if (typeof reviewer.review !== 'function') throw new Error('reviewer.review must be a function');

  const prior = await store.getByIdempotencyKey(idempotencyKey);
  if (prior) return { ok: true, duplicate: true, task: clone(prior) };

  const task = {
    schemaVersion: '1.0.0',
    taskId,
    idempotencyKey,
    objective,
    status: 'planning',
    plan: null,
    results: [],
    review: null,
    events: [],
    externalMutation: false,
    createdAt: now(),
    updatedAt: now()
  };
  await persist(store, task, 'task_created', { taskId, idempotencyKey });

  try {
    const planned = await planner.plan({
      taskId,
      objective,
      context: clone(input.context || {}),
      constraints: { maxSteps: Math.min(MAX_STEPS, options.maxSteps || MAX_STEPS) }
    });
    if (!planned || !Array.isArray(planned.steps) || planned.steps.length === 0) {
      throw new Error('planner must return a non-empty steps array');
    }
    if (planned.steps.length > Math.min(MAX_STEPS, options.maxSteps || MAX_STEPS)) {
      throw new Error('plan exceeds the configured step limit');
    }

    const allowedTools = new Set(options.allowedTools || []);
    const steps = planned.steps.map((step, index) => {
      const id = requiredText(step?.id || `step-${index + 1}`, 'step.id');
      const tool = requiredText(step?.tool, 'step.tool');
      const risk = ['low', 'medium', 'high', 'external'].includes(step?.risk) ? step.risk : 'high';
      if (!allowedTools.has(tool)) throw new Error(`tool is not allowlisted: ${tool}`);
      return { id, tool, risk, input: clone(step.input || {}), status: 'planned' };
    });
    if (new Set(steps.map(step => step.id)).size !== steps.length) {
      throw new Error('step ids must be unique');
    }

    task.plan = { summary: String(planned.summary || ''), steps };
    task.status = 'awaiting_approval';
    await persist(store, task, 'plan_created', {
      stepCount: steps.length,
      tools: [...new Set(steps.map(step => step.tool))]
    });

    const approvals = Array.isArray(input.approvals) ? input.approvals : [];
    const pending = [];
    for (const step of steps) {
      if (step.risk === 'external') {
        task.status = 'blocked';
        await persist(store, task, 'external_action_blocked', { stepId: step.id, tool: step.tool });
        return { ok: false, task: clone(task) };
      }
      if (step.risk === 'low') continue;
      let approved = false;
      if (approvalVerifier && typeof approvalVerifier.verify === 'function') {
        for (const token of approvals) {
          if (await approvalVerifier.verify({ token, task: clone(task), step: clone(step) })) {
            approved = true;
            break;
          }
        }
      }
      if (!approved) pending.push(step);
    }
    if (pending.length) {
      await persist(store, task, 'approval_required', { stepIds: pending.map(step => step.id) });
      task.updatedAt = now();
      await store.save(clone(task));
      return { ok: true, awaitingApproval: true, task: clone(task) };
    }

    task.status = 'executing';
    await persist(store, task, 'execution_started', { stepCount: steps.length });

    for (const step of steps) {
      step.status = 'running';
      await persist(store, task, 'step_started', { stepId: step.id, tool: step.tool });

      let result = null;
      let lastError = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          result = await executor.execute({
            taskId,
            step: clone(step),
            attempt,
            idempotencyKey: `${idempotencyKey}:${step.id}`
          });
          if (result?.ok === true) break;
          lastError = new Error(result?.error || 'executor returned an unsuccessful result');
        } catch (error) {
          lastError = error;
        }
        await persist(store, task, 'step_retry', {
          stepId: step.id,
          attempt: attempt + 1,
          reason: lastError instanceof Error ? lastError.message : 'execution failed'
        });
      }

      if (!result?.ok) {
        step.status = 'failed';
        task.status = 'failed';
        await persist(store, task, 'step_failed', {
          stepId: step.id,
          error: lastError instanceof Error ? lastError.message : 'execution failed'
        });
        return { ok: false, task: clone(task) };
      }

      step.status = 'completed';
      task.results.push({ stepId: step.id, tool: step.tool, output: clone(result.output ?? null) });
      await persist(store, task, 'step_completed', { stepId: step.id });
    }

    task.status = 'reviewing';
    await persist(store, task, 'review_started', { resultCount: task.results.length });
    const review = await reviewer.review({
      task: { taskId, objective },
      plan: clone(task.plan),
      results: clone(task.results)
    });
    task.review = clone(review || { ok: false, issues: ['Reviewer returned no result'] });

    if (review?.ok !== true) {
      task.status = 'review_failed';
      await persist(store, task, 'review_failed', {
        issues: Array.isArray(review?.issues) ? review.issues : ['Independent review did not pass']
      });
      return { ok: false, task: clone(task) };
    }

    task.status = 'completed';
    task.updatedAt = now();
    await persist(store, task, 'task_completed', { reviewerApproved: true });
    return { ok: true, task: clone(task) };
  } catch (error) {
    task.status = 'blocked';
    task.updatedAt = now();
    await persist(store, task, 'task_blocked', {
      reason: error instanceof Error ? error.message : 'workflow blocked'
    });
    return { ok: false, task: clone(task) };
  }
}

/** Test/demo adapter only. Not durable across process restarts. */
export function createInMemoryTaskStore() {
  const byKey = new Map();
  return {
    async getByIdempotencyKey(key) {
      const task = byKey.get(key);
      return task ? clone(task) : null;
    },
    async save(task) {
      byKey.set(task.idempotencyKey, clone(task));
      return clone(task);
    }
  };
}
