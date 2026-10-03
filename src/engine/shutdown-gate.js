const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

function envBoolean(name, fallback = false) {
  const value = String(process.env[name] ?? '').trim().toLowerCase();
  return value ? TRUTHY.has(value) : fallback;
}

function parseTimestamp(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/**
 * Configuration-driven shutdown gate.
 *
 * This is intentionally fail-closed for execution when a verified shutdown
 * condition is configured. It does not delete data, revoke credentials, or
 * mutate external systems. It only prevents new Engine execution and emits
 * an auditable reason.
 *
 * Conditions:
 * - MERCYSOUL_ENGINE_SHUTDOWN=true
 * - MERCYSOUL_ENGINE_SHUTDOWN_UNTIL=<ISO timestamp in the future>
 *
 * The gate is evaluated on every execution request so it works on Vercel's
 * stateless/serverless runtime without relying on process-local state.
 */
export function shutdownGate(now = Date.now()) {
  const explicit = envBoolean('MERCYSOUL_ENGINE_SHUTDOWN', false);
  const until = parseTimestamp(process.env.MERCYSOUL_ENGINE_SHUTDOWN_UNTIL);
  const scheduled = until !== null && until > now;

  if (explicit || scheduled) {
    return {
      enabled: false,
      state: 'DISABLED',
      reason: explicit ? 'explicit_shutdown_flag' : 'shutdown_window_active',
      shutdownUntil: until ? new Date(until).toISOString() : null,
      externalMutation: false,
    };
  }

  return {
    enabled: true,
    state: 'READY',
    reason: null,
    shutdownUntil: null,
    externalMutation: false,
  };
}

export function engineCanExecute(now = Date.now()) {
  const gate = shutdownGate(now);
  return gate.enabled;
}
