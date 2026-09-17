const SEVERITY_WEIGHT = Object.freeze({ info: 0, low: 10, medium: 25, high: 50, critical: 80 });
const TYPE_MULTIPLIER = Object.freeze({
  process: 1,
  startup_change: 1.15,
  credential_access_attempt: 1.35,
  input_hook: 1.35,
  network: 1,
  integrity: 1.1,
  agent: 0.5
});

export function scoreGuardianEvent(event = {}) {
  const severity = String(event.severity || 'info').toLowerCase();
  const type = String(event.event_type || event.eventType || 'agent').toLowerCase();
  const base = SEVERITY_WEIGHT[severity] ?? 0;
  const multiplier = TYPE_MULTIPLIER[type] ?? 1;
  return Math.max(0, Math.min(100, Math.round(base * multiplier)));
}

export function classifyRisk(score) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  if (value >= 80) return 'critical';
  if (value >= 50) return 'high';
  if (value >= 25) return 'medium';
  if (value > 0) return 'low';
  return 'info';
}
