import crypto from 'node:crypto';
import { osStatus, processInput } from './os-core.js';
import { supabaseStatus, persistEventBestEffort } from './supabase.js';
import { commandCenterStatus, createCommandTask, getCommandTask, controlCommandTask, updateCommandProgress } from './agent/command-center.js';

const VERSION = '11.1.0';
const startedAt = new Date().toISOString();

const LAYERS = Object.freeze([
  { id: 'core-processor', name: 'Core Processor', responsibility: 'intent, governance, moderation and orchestration' },
  { id: 'power-source', name: 'Power Source', responsibility: 'configured AI providers and runtime configuration' },
  { id: 'output-actuator', name: 'Output Actuator', responsibility: 'API responses, webhooks and generated outputs' },
  { id: 'cooling-system', name: 'Cooling System', responsibility: 'rate limits, sealed gates, timeouts and safe failure' },
  { id: 'feedback-loop', name: 'Feedback Loop', responsibility: 'durable events, audit records and deployment reports' },
]);

export function operatingSystemStatus() {
  const core = osStatus();
  const persistence = supabaseStatus();
  return {
    id: 'MERCYSOUL-OS',
    operatingSystemVersion: VERSION,
    state: 'online',
    startedAt,
    architecture: 'Core Processor → Power Source → Output Actuator → Cooling System → Feedback Loop',
    layers: LAYERS,
    coreVersion: core.coreVersion,
    modules: core.modules,
    policy: core.policy,
    persistence,
    commandCenter: commandCenterStatus(),
    capabilities: {
      agentOrchestration: true,
      durableAgentTasks: commandCenterStatus().persistence.configured,
      moderation: true,
      governance: true,
      durableEvents: persistence.healthy,
      deploymentReporting: true,
      externalPlatformControl: false,
    },
  };
}

export async function executeOperatingSystem(input = {}, options = {}) {
  const requestId = options.requestId || input.requestId || crypto.randomUUID();
  const started = Date.now();

  if (input.type === 'command_center') {
    const action = String(input.action || 'status').toLowerCase();
    let data;
    if (action === 'create') {
      data = await createCommandTask(input.command, { priority: input.priority, agents: input.agents });
    } else if (action === 'status') {
      data = input.taskId ? await getCommandTask(input.taskId) : { status: commandCenterStatus() };
    } else if (action === 'progress') {
      data = await updateCommandProgress(input.taskId, input.progress, input.checkpoint);
    } else {
      data = await controlCommandTask(input.taskId, action, input);
    }
    await persistEventBestEffort({ eventType: 'command_center_control', requestId, payload: { action, taskId: input.taskId || data?.task?.id || null, durable: data?.durable ?? false } });
    return { ok: true, requestId, osVersion: VERSION, durationMs: Date.now() - started, commandCenter: data };
  }

  let result;
  try {
    result = processInput({ ...input, requestId });
  } catch (error) {
    await persistEventBestEffort({
      eventType: 'os_execution_error',
      requestId,
      payload: { message: error instanceof Error ? error.message : 'Execution failed' },
    });
    throw error;
  }

  const response = {
    ok: true,
    requestId,
    osVersion: VERSION,
    durationMs: Date.now() - started,
    result,
  };

  await persistEventBestEffort({
    eventType: 'os_execution',
    requestId,
    payload: {
      type: input.type || 'post',
      decision: result?.decision || null,
      riskScore: result?.riskScore ?? null,
      osVersion: VERSION,
    },
  });

  return response;
}
