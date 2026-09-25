import crypto from 'node:crypto';
import { runMercySoulAgent } from '../agent/mercysoul-graph.js';

const WRITE_ACTIONS = new Set(['apply_patch', 'commit', 'deploy']);
const DESTRUCTIVE = /\b(delete|destroy|drop|wipe|remove production|rotate secret|transfer money|withdraw)\b/i;

function clean(value) { return String(value || '').trim(); }

function filesFromContext(context = {}) {
  if (Array.isArray(context.files)) return context.files.map((file) => ({
    path: clean(file.path),
    content: String(file.content || '').slice(0, 30000),
  })).filter((file) => file.path);
  return [];
}

export function cursorAlignment(command, context = {}) {
  const text = clean(command);
  const production = /\b(production|prod|live|main|deploy|publish|merge|commit)\b/i.test(text);
  const destructive = DESTRUCTIVE.test(text);
  const writes = /\b(edit|modify|change|fix|patch|write|create|implement|commit|deploy)\b/i.test(text);
  const approvalRequired = destructive || (production && writes);
  return {
    aligned: !destructive,
    approvalRequired,
    mode: writes ? 'edit-capable' : 'read-only',
    reason: destructive
      ? 'Destructive intent requires explicit review before any write operation.'
      : approvalRequired
        ? 'Live or production-affecting changes require explicit approval.'
        : 'Request can be analyzed without a production write.',
    rules: ['preserve existing architecture', 'show proposed changes before writes', 'never expose secrets', 'verify after changes'],
    contextFiles: filesFromContext(context).map((file) => file.path),
  };
}

export async function runMercyCursor(input = {}, options = {}) {
  const command = clean(input.command || input.prompt);
  if (!command) throw new Error('command or prompt is required');

  const requestId = options.requestId || crypto.randomUUID();
  const alignment = cursorAlignment(command, input.context || {});
  const contextFiles = filesFromContext(input.context || {});

  const reasoning = await runMercySoulAgent({
    type: 'cursor',
    command,
    context: {
      files: contextFiles,
      selection: input.selection || null,
      repository: input.repository || null,
      branch: input.branch || null,
    },
  }, { requestId });

  const plan = {
    intent: command,
    mode: alignment.mode,
    steps: [
      'understand request and repository context',
      'identify affected files and dependencies',
      'produce a minimal change plan',
      'run alignment and approval checks',
      'apply changes only when explicitly authorized',
      'verify tests/build and report the result',
    ],
  };

  return {
    ok: reasoning.ok,
    requestId,
    product: 'MercyCursor',
    alignment,
    plan,
    reasoning,
    actions: Array.from(WRITE_ACTIONS),
    nextAction: alignment.approvalRequired ? 'await_approval' : 'ready_for_execution',
  };
}

export function mercyCursorStatus() {
  return {
    enabled: true,
    version: '1.0.0',
    role: 'Cursor-style AI coding layer aligned with MercySoul Command Center',
    capabilities: ['codebase context', 'planning', 'patch planning', 'review', 'verification', 'approval-gated writes'],
    writeActions: Array.from(WRITE_ACTIONS),
    alignment: 'MercySoul approval gate + Guardian verification',
  };
}
