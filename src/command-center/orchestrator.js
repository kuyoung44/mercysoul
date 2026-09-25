import crypto from 'node:crypto';
import { persistEventBestEffort } from '../supabase.js';
import { runMercySoulAgent } from '../agent/mercysoul-graph.js';
import { runMercyCursor } from '../cursor/mercy-cursor.js';

const AGENTS = {
  cursor: { name: 'MercyCursor', capabilities: ['code edit','coding','cursor','patch','refactor','review','codebase'] },
  github: { name: 'GitHub Agent', capabilities: ['code','repo','commit','branch','pull request','github'] },
  vercel: { name: 'Vercel Agent', capabilities: ['deploy','deployment','vercel','preview'] },
  supabase: { name: 'Supabase Agent', capabilities: ['database','sql','schema','supabase','data'] },
  guardian: { name: 'Guardian', capabilities: ['health','security','alignment','guardian','verify','test'] },
  browser: { name: 'Browser Agent', capabilities: ['browser','ui','page','click','screenshot','test live'] },
  mercy: { name: 'MercySoul Agent', capabilities: ['reason','research','moderate','analyze','plan'] },
};

const SENSITIVE = ['delete','destroy','drop database','remove production','rotate secret','payment','withdraw','transfer money'];
const CONFIRMATION = ['production','prod','live','main','merge','publish'];

function normalize(command) {
  return String(command || '').trim().replace(/\\s+/g, ' ');
}

export function routeCommand(command) {
  const text = normalize(command).toLowerCase();
  const scores = Object.fromEntries(Object.entries(AGENTS).map(([id]) => [id, 0]));

  for (const [id, agent] of Object.entries(AGENTS)) {
    for (const capability of agent.capabilities) if (text.includes(capability)) scores[id] += 1;
  }

  if (text.startsWith('build') || text.startsWith('create') || text.startsWith('implement')) {
    scores.github += 2; scores.cursor += 3; scores.guardian += 1;
  }
  if (text.includes('deploy')) { scores.vercel += 3; scores.github += 1; scores.cursor += 1; scores.guardian += 1; }
  if (text.includes('check') || text.includes('broken') || text.includes('error')) {
    scores.guardian += 3; scores.browser += 2;
  }

  const agents = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  if (!agents.length) agents.push('mercy');

  const sensitive = SENSITIVE.some(term => text.includes(term));
  const approvalRequired = sensitive || CONFIRMATION.some(term => text.includes(term));

  return {
    agents,
    scores,
    approvalRequired,
    reason: approvalRequired
      ? 'The command touches a sensitive or live/production operation.'
      : 'The command can be planned and executed by the selected agents.',
  };
}

function makePlan(command, route) {
  const steps = [];
  if (route.agents.includes('cursor')) steps.push({ id: 'cursor', agent: 'cursor', action: 'analyze codebase and produce an aligned coding plan' });
  if (route.agents.includes('github')) steps.push({ id: 'github', agent: 'github', action: 'inspect or modify repository' });
  if (route.agents.includes('supabase')) steps.push({ id: 'supabase', agent: 'supabase', action: 'inspect or update durable data layer' });
  if (route.agents.includes('vercel')) steps.push({ id: 'vercel', agent: 'vercel', action: 'inspect or deploy application' });
  if (route.agents.includes('guardian')) steps.push({ id: 'guardian', agent: 'guardian', action: 'run health/security/alignment verification' });
  if (route.agents.includes('browser')) steps.push({ id: 'browser', agent: 'browser', action: 'verify live UI and key interactions' });
  if (route.agents.includes('mercy')) steps.push({ id: 'mercy', agent: 'mercy', action: 'analyze command and produce execution guidance' });
  return { command, agents: route.agents, steps };
}

export async function createCommand(command, options = {}) {
  const normalized = normalize(command);
  if (!normalized) throw new Error('command is required');

  const id = options.id || crypto.randomUUID();
  const route = routeCommand(normalized);
  const plan = makePlan(normalized, route);

  const task = {
    id,
    command: normalized,
    status: route.approvalRequired && options.approved !== true ? 'paused' : 'queued',
    progress: 0,
    agents: route.agents,
    approvalRequired: route.approvalRequired,
    approvalReason: route.approvalRequired ? route.reason : null,
    plan,
    createdAt: new Date().toISOString(),
  };

  await persistEventBestEffort({
    eventType: 'command_center_task_created',
    requestId: options.requestId || id,
    payload: task,
  });

  return task;
}

export async function executeCommand(task, options = {}) {
  if (!task || task.status === 'paused') return task;
  const startedAt = new Date().toISOString();
  const results = [];

  for (const agent of task.agents) {
    const result = { agent, status: 'completed', startedAt: new Date().toISOString() };
    try {
      if (agent === 'cursor') {
        result.output = await runMercyCursor({ command: task.command }, { requestId: options.requestId || task.id });
      } else if (agent === 'mercy') {
        result.output = await runMercySoulAgent({ command: task.command, type: 'command-center' }, { requestId: options.requestId || task.id });
      } else {
        result.output = { status: 'ready', message: `${AGENTS[agent].name} is selected. External credentials/API adapter are required for live execution.` };
      }
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
    }
    result.completedAt = new Date().toISOString();
    results.push(result);
  }

  const failed = results.some((item) => item.status === 'failed');
  const completed = {
    ...task,
    status: failed ? 'failed' : 'completed',
    progress: 100,
    results,
    startedAt,
    completedAt: new Date().toISOString(),
  };

  await persistEventBestEffort({
    eventType: 'command_center_task_completed',
    requestId: options.requestId || task.id,
    payload: completed,
  });

  return completed;
}

export function commandCenterStatus() {
  return {
    enabled: true,
    version: '1.0.0',
    agents: Object.entries(AGENTS).map(([id, agent]) => ({ id, name: agent.name, capabilities: agent.capabilities })),
    approvalGate: true,
    durableEvents: true,
  };
}
