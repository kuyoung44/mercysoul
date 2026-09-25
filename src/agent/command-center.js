import crypto from 'node:crypto';

const MAX_AGENTS = 3;
const TASK_LIMIT = 100;
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TABLE = process.env.SUPABASE_AGENT_TASKS_TABLE || 'mercysoul_agent_tasks';
const tasks = new Map();

const now = () => new Date().toISOString();
const configured = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function normalizeTask(row) {
  return {
    id: row.id,
    command: row.command,
    priority: row.priority || 'normal',
    status: row.status || 'queued',
    agents: Array.isArray(row.agents) ? row.agents : [],
    progress: Number(row.progress || 0),
    checkpoint: row.checkpoint || null,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    resumedAt: row.resumed_at || row.resumedAt || null,
  };
}

async function persist(task) {
  if (!configured()) return { durable: false };
  const payload = {
    id: task.id,
    command: task.command,
    priority: task.priority,
    status: task.status,
    agents: task.agents,
    progress: task.progress,
    checkpoint: task.checkpoint,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    resumed_at: task.resumedAt,
  };
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(TABLE)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Command Center persistence failed (${response.status})`);
  return { durable: true };
}

async function updateDurable(task) {
  if (!configured()) return { durable: false };
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(TABLE)}?id=eq.${encodeURIComponent(task.id)}`, {
    method: 'PATCH',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify({
      priority: task.priority,
      status: task.status,
      agents: task.agents,
      progress: task.progress,
      checkpoint: task.checkpoint,
      updated_at: task.updatedAt,
      resumed_at: task.resumedAt,
    }),
  });
  if (!response.ok) throw new Error(`Command Center update failed (${response.status})`);
  return { durable: true };
}

async function fetchDurable(id) {
  if (!configured()) return null;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(TABLE)}?id=eq.${encodeURIComponent(id)}&limit=1`, { headers: { ...headers(), Prefer: 'return=representation' } });
  if (!response.ok) return null;
  const rows = await response.json();
  return rows[0] ? normalizeTask(rows[0]) : null;
}

function remember(task) {
  tasks.set(task.id, task);
  while (tasks.size > TASK_LIMIT) tasks.delete(tasks.keys().next().value);
  return task;
}

export function commandCenterStatus() {
  const active = [...tasks.values()].filter((task) => ['queued', 'running', 'paused'].includes(task.status));
  return {
    enabled: true,
    mode: 'durable-agent-orchestration',
    maxAgents: MAX_AGENTS,
    activeTasks: active.length,
    inMemoryTasks: tasks.size,
    persistence: { configured: configured(), table: TABLE },
    controls: ['normal', 'low-priority', 'pause', 'resume', 'stop'],
  };
}

export async function createCommandTask(command, options = {}) {
  const text = String(command || '').trim();
  if (!text) throw new Error('command is required');
  const createdAt = now();
  const task = {
    id: options.id || `ms-task-${crypto.randomUUID()}`,
    command: text,
    priority: options.priority === 'low' ? 'low' : 'normal',
    status: 'running',
    agents: Array.from({ length: Math.min(Math.max(Number(options.agents) || 1, 1), MAX_AGENTS) }, (_, index) => ({ id: `agent-${index + 1}`, status: index === 0 ? 'working' : 'ready' })),
    progress: 0,
    checkpoint: { phase: 'accepted', message: 'Command accepted by the Command Center.' },
    createdAt,
    updatedAt: createdAt,
    resumedAt: null,
  };
  remember(task);
  let durable = false;
  try { durable = (await persist(task)).durable; } catch (error) { task.checkpoint = { ...task.checkpoint, persistenceWarning: error.message }; }
  return { task, durable };
}

export async function getCommandTask(id) {
  if (!id) throw new Error('task id is required');
  if (tasks.has(id)) return { task: tasks.get(id), durable: configured() };
  const task = await fetchDurable(id);
  if (!task) return null;
  remember(task);
  return { task, durable: true };
}

export async function controlCommandTask(id, action, payload = {}) {
  const loaded = await getCommandTask(id);
  if (!loaded) throw new Error('task not found');
  const task = loaded.task;
  const normalized = String(action || '').toLowerCase().replace(/_/g, '-');

  if (normalized === 'low-priority' || normalized === 'low') {
    task.priority = task.priority === 'low' ? 'normal' : 'low';
    task.checkpoint = { phase: task.priority === 'low' ? 'deprioritized' : 'restored', message: task.priority === 'low' ? 'Task continues at lower priority.' : 'Task priority restored.' };
  } else if (normalized === 'pause') {
    task.status = 'paused';
    task.agents = task.agents.map((agent) => ({ ...agent, status: 'paused' }));
    task.checkpoint = { phase: 'paused', message: 'Checkpoint saved; resume can continue from this state.' };
  } else if (normalized === 'resume') {
    task.status = 'running';
    task.resumedAt = now();
    task.agents = task.agents.map((agent, index) => ({ ...agent, status: index === 0 ? 'working' : 'ready' }));
    task.checkpoint = { phase: 'resumed', message: 'Task resumed from the last checkpoint.' };
  } else if (normalized === 'stop') {
    task.status = 'stopped';
    task.agents = task.agents.map((agent) => ({ ...agent, status: 'stopped' }));
    task.checkpoint = { phase: 'stopped', message: 'Task stopped by Command Center control.' };
  } else if (normalized === 'checkpoint') {
    task.checkpoint = { phase: String(payload.phase || 'manual'), message: String(payload.message || 'Manual checkpoint saved.'), metadata: payload.metadata || {} };
  } else {
    throw new Error(`unsupported action: ${action}`);
  }

  task.updatedAt = now();
  remember(task);
  let durable = false;
  try { durable = (await updateDurable(task)).durable; } catch (error) { task.checkpoint = { ...task.checkpoint, persistenceWarning: error.message }; }
  return { task, durable };
}

export async function updateCommandProgress(id, progress, checkpoint = null) {
  const loaded = await getCommandTask(id);
  if (!loaded) throw new Error('task not found');
  const task = loaded.task;
  task.progress = Math.max(0, Math.min(100, Number(progress) || 0));
  if (checkpoint) task.checkpoint = checkpoint;
  if (task.progress >= 100) {
    task.status = 'completed';
    task.agents = task.agents.map((agent) => ({ ...agent, status: 'complete' }));
  }
  task.updatedAt = now();
  remember(task);
  const durable = (await updateDurable(task)).durable;
  return { task, durable };
}
