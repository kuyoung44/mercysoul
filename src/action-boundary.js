const CONSEQUENT_ACTIONS = new Set([
  'create',
  'modify',
  'delete',
  'commit',
  'configure',
  'publish',
  'deploy',
  'disclose',
  'export',
  'transfer'
]);

const READ_ACTIONS = new Set(['inspect', 'retrieve', 'analyze', 'compare', 'verify', 'scan']);

export function classifyAction(action = '') {
  const normalized = String(action).trim().toLowerCase();
  if (CONSEQUENT_ACTIONS.has(normalized)) return 'write';
  if (READ_ACTIONS.has(normalized)) return 'read';
  return 'unknown';
}

export function requiresConfirmation({ action, target, purpose, authorized = false } = {}) {
  const type = classifyAction(action);
  const missing = [];
  if (!action) missing.push('action');
  if (!target) missing.push('target');
  if (!purpose) missing.push('purpose');
  if (!authorized) missing.push('authorization');

  return {
    type,
    allowed: type !== 'unknown' && missing.length === 0,
    confirmationRequired: type === 'write',
    missing
  };
}

export function validateConfirmation(proposal, confirmation = '') {
  const check = requiresConfirmation(proposal);
  const accepted = String(confirmation).trim().toUpperCase() === 'CONFIRM';

  return {
    ...check,
    confirmed: check.confirmationRequired ? accepted : true,
    executable: check.allowed && (!check.confirmationRequired || accepted)
  };
}

export function actionBoundarySummary(proposal, confirmation = '') {
  const result = validateConfirmation(proposal, confirmation);
  return {
    stage: result.executable ? 'authorized-for-tool' : 'stop-and-confirm',
    actionType: result.type,
    confirmationRequired: result.confirmationRequired,
    confirmed: result.confirmed,
    executable: result.executable,
    missing: result.missing
  };
}
