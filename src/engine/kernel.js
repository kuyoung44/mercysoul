import crypto from 'node:crypto';
import { persistEventBestEffort } from '../supabase.js';
import { routeCommand } from '../orchestrator/router.js';
import { createCommandTask } from '../agent/command-center.js';
import { executeOrchestrationTask } from '../orchestrator/executor.js';
import { engineCanExecute, shutdownGate } from './shutdown-gate.js';

export const ENGINE_LIFECYCLE = Object.freeze([
  'STOP',
  'VERIFY',
  'AUTHORIZE',
  'EXECUTE',
  'VERIFY_RESULT',
  'AUDIT',
]);

export function engineStatus() {
  return {
    name: 'MercySoul Engine',
    version: '1.0.0',
    mode: 'execution-control-plane',
    lifecycle: ENGINE_LIFECYCLE,
    aiIsComponent: true,
    authorityExpansion: false,
    durableAudit: true,
    executionRequiresExplicitAuthorization: true,
    shutdown: shutdownGate(),
  };
}

export async function runEngine(command, options = {}) {
  const text = String(command || '').trim();
  if (!text) throw new Error('command is required');

  const executionId = crypto.randomUUID();
  const shutdown = shutdownGate();

  if (!engineCanExecute()) {
    await persistEventBestEffort({
      eventType: 'engine_shutdown',
      requestId: executionId,
      payload: { phase: 'DISABLED', reason: shutdown.reason, shutdownUntil: shutdown.shutdownUntil },
    });
    return {
      ok: false,
      execution: 'disabled',
      executionId,
      lifecycle: ENGINE_LIFECYCLE,
      shutdown,
    };
  }

  const plan = routeCommand(text);
  const requestedWrite = options.execute === true;

  await persistEventBestEffort({
    eventType: 'engine_lifecycle',
    requestId: executionId,
    payload: { phase: 'STOP', command: text },
  });

  await persistEventBestEffort({
    eventType: 'engine_lifecycle',
    requestId: executionId,
    payload: { phase: 'VERIFY', selectedTools: plan.selectedTools.map(t => t.id), requiresApproval: plan.requiresApproval },
  });

  if (plan.requiresApproval && !requestedWrite) {
    return {
      ok: true,
      execution: 'approval-required',
      executionId,
      lifecycle: ENGINE_LIFECYCLE,
      plan,
    };
  }

  if (requestedWrite !== true) {
    return {
      ok: true,
      execution: 'plan-only',
      executionId,
      lifecycle: ENGINE_LIFECYCLE,
      plan,
    };
  }

  await persistEventBestEffort({
    eventType: 'engine_lifecycle',
    requestId: executionId,
    payload: { phase: 'AUTHORIZE', authorized: true },
  });

  const accepted = await createCommandTask(text, {
    agents: options.agents,
    priority: options.priority,
  });

  await persistEventBestEffort({
    eventType: 'engine_lifecycle',
    requestId: executionId,
    payload: { phase: 'EXECUTE', taskId: accepted.task.id },
  });

  const result = await executeOrchestrationTask(accepted.task.id, {
    payload: options.payload || {},
    continueOnError: options.continueOnError === true,
  });

  const verified = result.halted !== true && result.results.every(item => item.ok);

  await persistEventBestEffort({
    eventType: 'engine_lifecycle',
    requestId: executionId,
    payload: {
      phase: 'VERIFY_RESULT',
      verified,
      taskId: accepted.task.id,
      results: result.results.map(item => ({
        provider: item.provider,
        action: item.action,
        ok: item.ok,
      })),
    },
  });

  await persistEventBestEffort({
    eventType: 'engine_lifecycle',
    requestId: executionId,
    payload: { phase: 'AUDIT', verified, taskId: accepted.task.id },
  });

  return {
    ok: verified,
    execution: verified ? 'completed-and-verified' : 'completed-with-errors',
    executionId,
    lifecycle: ENGINE_LIFECYCLE,
    plan,
    ...result,
    verified,
  };
}
