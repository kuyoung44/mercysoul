import crypto from 'node:crypto';
import { persistEventBestEffort } from './supabase.js';

const AXIS = Object.freeze({
  id: 'MERCYSOUL-VISION-LIVING-SEAL',
  version: '1.0.0',
  state: 'continuously-refreshing',
  identity: 'persistent',
  seal: 'always-active',
  authority: 'non-expanding',
  cycle: ['STOP', 'VERIFY', 'CONTROL', 'MONITOR'],
  allowedActions: ['health-check', 'integrity-check', 'permission-drift-check', 'safe-reconciliation', 'reseal', 'audit'],
  prohibitedActions: ['grant-permissions', 'arbitrary-deploy', 'delete-data', 'change-governing-rules']
});

let lastRefreshAt = null;
let lastRefresh = null;
let timer = null;
let running = false;

function verify() {
  const violations = [];
  if (AXIS.seal !== 'always-active') violations.push('seal-inactive');
  if (AXIS.authority !== 'non-expanding') violations.push('authority-expansion');
  if (!AXIS.cycle.includes('STOP') || !AXIS.cycle.includes('VERIFY') || !AXIS.cycle.includes('CONTROL')) {
    violations.push('invalid-control-cycle');
  }
  return {
    ok: violations.length === 0,
    identity: AXIS.id,
    version: AXIS.version,
    violations
  };
}

export async function refreshLivingSeal(reason = 'scheduled') {
  if (running) return { ok: false, skipped: true, reason: 'refresh-in-progress' };
  running = true;
  const startedAt = new Date().toISOString();
  try {
    const verification = verify();
    const result = {
      id: crypto.randomUUID(),
      axis: AXIS.id,
      reason,
      phase: verification.ok ? 'CONTROL' : 'STOP',
      verified: verification.ok,
      sealed: verification.ok,
      authorityExpanded: false,
      violations: verification.violations,
      startedAt,
      refreshedAt: new Date().toISOString()
    };
    lastRefreshAt = result.refreshedAt;
    lastRefresh = result;
    await persistEventBestEffort({
      eventType: 'living_seal.refresh',
      requestId: result.id,
      payload: result
    });
    return { ok: verification.ok, result };
  } finally {
    running = false;
  }
}

export function livingSealStatus() {
  return {
    ...AXIS,
    ok: lastRefresh ? lastRefresh.verified : verify().ok,
    running,
    lastRefreshAt,
    lastRefresh
  };
}

export function startLivingSealRefresh() {
  if (timer) return timer;
  const minutes = Math.max(Number(process.env.LIVING_SEAL_REFRESH_MINUTES) || 15, 1);
  refreshLivingSeal('startup').catch(() => {});
  timer = setInterval(() => refreshLivingSeal('scheduled').catch(() => {}), minutes * 60 * 1000);
  timer.unref?.();
  return timer;
}
