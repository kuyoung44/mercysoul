export const EVENT_TYPES = Object.freeze([
  'process',
  'startup_change',
  'credential_access_attempt',
  'input_hook',
  'network',
  'integrity',
  'agent',
]);

export const SEVERITIES = Object.freeze(['info', 'low', 'medium', 'high', 'critical']);

const MAX_TITLE = 200;

export function createGuardianEvent({ agentId, ownerId, eventType, severity = 'info', title, details = {}, occurredAt = new Date().toISOString() }) {
  if (!agentId || !ownerId) throw new Error('agentId and ownerId are required');
  if (!EVENT_TYPES.includes(eventType)) throw new Error('invalid eventType');
  if (!SEVERITIES.includes(severity)) throw new Error('invalid severity');
  if (typeof title !== 'string' || !title.trim()) throw new Error('title is required');

  return {
    agent_id: agentId,
    owner_id: ownerId,
    event_type: eventType,
    severity,
    title: title.trim().slice(0, MAX_TITLE),
    details: sanitizeDetails(details),
    occurred_at: occurredAt,
  };
}

function sanitizeDetails(value) {
  const blocked = /password|passwd|secret|token|cookie|clipboard|keystroke|keylog|credential_value|message_body/i;
  const walk = (v) => {
    if (Array.isArray(v)) return v.slice(0, 50).map(walk);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).slice(0, 50).filter(([k]) => !blocked.test(k)).map(([k, x]) => [k, walk(x)]));
    }
    if (typeof v === 'string') return blocked.test(v) ? '[redacted]' : v.slice(0, 1000);
    if (typeof v === 'number' || typeof v === 'boolean' || v === null) return v;
    return '[redacted]';
  };
  return walk(value);
}
