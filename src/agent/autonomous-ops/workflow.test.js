import test from 'node:test';
import assert from 'node:assert/strict';
import { createInMemoryTaskStore, runAutonomousTask } from './workflow.js';

function adapters(overrides = {}) {
  return {
    store: createInMemoryTaskStore(),
    planner: {
      async plan() {
        return {
          summary: 'Inspect the requested internal service',
          steps: [{ id: 'health-check', tool: 'internal.health', risk: 'low', input: { service: 'demo' } }]
        };
      }
    },
    executor: { async execute() { return { ok: true, output: { healthy: true } }; } },
    reviewer: { async review() { return { ok: true, issues: [] }; } },
    ...overrides
  };
}
const input = { taskId: 'task-1', idempotencyKey: 'request-1', objective: 'Check demo service health' };

test('runs planner, allowlisted worker and independent reviewer', async () => {
  const result = await runAutonomousTask(input, adapters(), { allowedTools: ['internal.health'] });
  assert.equal(result.ok, true);
  assert.equal(result.task.status, 'completed');
  assert.equal(result.task.events.at(-1).type, 'task_completed');
  assert.equal(result.task.externalMutation, false);
});

test('returns the prior task for a repeated idempotency key', async () => {
  const a = adapters();
  const first = await runAutonomousTask(input, a, { allowedTools: ['internal.health'] });
  const second = await runAutonomousTask({ ...input, taskId: 'task-2' }, a, { allowedTools: ['internal.health'] });
  assert.equal(first.task.taskId, second.task.taskId);
  assert.equal(second.duplicate, true);
});

test('pauses medium and higher-risk steps until exact scoped approval exists', async () => {
  const a = adapters({
    planner: { async plan() { return { steps: [{ id: 'write-note', tool: 'internal.write', risk: 'medium' }] }; } }
  });
  const result = await runAutonomousTask(input, a, { allowedTools: ['internal.write'] });
  assert.equal(result.awaitingApproval, true);
  assert.equal(result.task.status, 'awaiting_approval');
  assert.equal(result.task.events.at(-1).type, 'approval_required');
});

test('accepts only task-, step-, actor- and tool-scoped approval', async () => {
  const a = adapters({
    planner: { async plan() { return { steps: [{ id: 'write-note', tool: 'internal.write', risk: 'medium' }] }; } },
    approvalVerifier: { async verify({ token, task, step }) { return token === 'valid-approval' && task.taskId === 'task-1' && step.id === 'write-note' && step.tool === 'internal.write'; } }
  });
  const result = await runAutonomousTask({ ...input, approvals: ['valid-approval'] }, a, { allowedTools: ['internal.write'] });
  assert.equal(result.ok, true);
  assert.equal(result.task.status, 'completed');
});

test('blocks tools that are not on the allowlist', async () => {
  const result = await runAutonomousTask(input, adapters(), { allowedTools: [] });
  assert.equal(result.ok, false);
  assert.equal(result.task.status, 'blocked');
});

test('does not pass a failed reviewer result', async () => {
  const a = adapters({ reviewer: { async review() { return { ok: false, issues: ['Evidence incomplete'] }; } } });
  const result = await runAutonomousTask(input, a, { allowedTools: ['internal.health'] });
  assert.equal(result.ok, false);
  assert.equal(result.task.status, 'review_failed');
});

test('retries a failed worker within a fixed bound', async () => {
  let attempts = 0;
  const a = adapters({
    executor: { async execute() { attempts += 1; return attempts < 2 ? { ok: false, error: 'temporary failure' } : { ok: true, output: 'recovered' }; } }
  });
  const result = await runAutonomousTask(input, a, { allowedTools: ['internal.health'] });
  assert.equal(result.ok, true);
  assert.equal(attempts, 2);
});

test('blocks external-risk actions even when the tool is allowlisted', async () => {
  const a = adapters({ planner: { async plan() { return { steps: [{ id: 'send-email', tool: 'external.email', risk: 'external' }] }; } } });
  const result = await runAutonomousTask(input, a, { allowedTools: ['external.email'] });
  assert.equal(result.ok, false);
  assert.equal(result.task.status, 'blocked');
  assert.equal(result.task.events.at(-1).type, 'external_action_blocked');
});
