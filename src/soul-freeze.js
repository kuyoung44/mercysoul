import crypto from 'node:crypto';

export const SOUL_FREEZE_PROTOCOL = Object.freeze({
  name: 'MercySoul Impartial Justice & Soul-Freeze Protocol',
  version: '6.0.0',
  equalTreatment: true,
  ownerExemption: false,
  adminExemption: false,
  clientExemption: false,
  evidenceRequired: true,
  radeRequired: true,
  criticalSuspension: 'immediate',
  defaultFreezeMs: 24 * 60 * 60 * 1000,
  blockedCapabilities: ['generate', 'post', 'view', 'reentry']
});

const Rade = Object.freeze({
  CREDIBLE_VIOLENT_THREAT: 'RADE-SAFETY-001',
  SEXUAL_EXPLOITATION: 'RADE-SAFETY-002',
  NON_CONSENSUAL_SEXUAL: 'RADE-SAFETY-003',
  EXTREMIST_SUPPORT: 'RADE-SAFETY-004',
  SELF_HARM_ENCOURAGEMENT: 'RADE-SAFETY-005',
  CRITICAL_POLICY_VIOLATION: 'RADE-CRITICAL-999'
});

const criticalCategories = new Map([
  ['credible_violent_threat', Rade.CREDIBLE_VIOLENT_THREAT],
  ['sexual_exploitation', Rade.SEXUAL_EXPLOITATION],
  ['non_consensual_sexual', Rade.NON_CONSENSUAL_SEXUAL],
  ['extremist_support', Rade.EXTREMIST_SUPPORT],
  ['self_harm_encouragement', Rade.SELF_HARM_ENCOURAGEMENT]
]);

const accounts = new Map();
const auditLog = [];

function actorRole(input = {}) {
  const role = String(input.accountRole || input.role || 'client').toLowerCase();
  return ['owner', 'admin', 'client', 'user'].includes(role) ? role : 'client';
}

function evidenceFrom(input, assessment = {}) {
  return {
    requestId: input.requestId || null,
    source: input.source || input.path || 'unknown',
    contentId: input.id || null,
    categories: assessment.categories || [],
    reasons: assessment.reasons || [],
    score: assessment.score ?? assessment.riskScore ?? null,
    confidence: assessment.confidence ?? null,
    capturedAt: new Date().toISOString()
  };
}

export function deriveRade(assessment = {}) {
  for (const category of assessment.categories || []) {
    if (criticalCategories.has(category)) return criticalCategories.get(category);
  }
  return assessment.hardSafety ? Rade.CRITICAL_POLICY_VIOLATION : null;
}

export function isCritical(assessment = {}) {
  return Boolean(deriveRade(assessment));
}

export function adjudicateAccount(input = {}, assessment = {}) {
  const accountId = input.accountId || input.userId || input.actorId;
  const role = actorRole(input);
  const rade = deriveRade(assessment);
  const critical = Boolean(rade);
  if (!accountId || !critical) {
    return { critical, suspended: false, accountId: accountId || null, role, rade: rade || null };
  }

  const now = Date.now();
  const freezeUntil = new Date(now + (Number(input.freezeMs) > 0 ? Number(input.freezeMs) : SOUL_FREEZE_PROTOCOL.defaultFreezeMs)).toISOString();
  const record = {
    accountId,
    role,
    status: 'suspended',
    action: 'soul-freeze',
    rade,
    reason: (assessment.reasons || []).join('; ') || 'Critical safety violation',
    evidence: evidenceFrom(input, assessment),
    suspendedAt: new Date(now).toISOString(),
    freezeUntil,
    ownerExempt: false,
    adminExempt: false,
    clientExempt: false
  };
  accounts.set(String(accountId), record);
  auditLog.push({
    id: crypto.randomUUID(),
    event: 'critical-suspension',
    ...record
  });
  return { critical: true, suspended: true, ...record };
}

export function getAccountStatus(accountId) {
  const record = accounts.get(String(accountId));
  if (!record) return { accountId: accountId || null, status: 'active', soulFreeze: false };
  if (record.freezeUntil && Date.now() >= Date.parse(record.freezeUntil)) {
    accounts.delete(String(accountId));
    return { accountId, status: 'active', soulFreeze: false, previouslyFrozen: true };
  }
  return { ...record, soulFreeze: true, blockedCapabilities: SOUL_FREEZE_PROTOCOL.blockedCapabilities };
}

export function isFrozen(accountId) {
  return Boolean(accountId && getAccountStatus(accountId).soulFreeze);
}

export function soulFreezeMiddleware(req, res, next) {
  if (req.method === 'GET' && ['/health', '/api/status', '/api/moderation/policy'].includes(req.path)) return next();
  const accountId = req.body?.accountId || req.get('x-account-id');
  if (!accountId) return next();
  const status = getAccountStatus(accountId);
  if (!status.soulFreeze) return next();
  return res.status(423).json({
    ok: false,
    error: 'ACCOUNT_SOUL_FROZEN',
    requestId: req.requestId,
    ...status,
    notice: 'Account access is suspended under the MercySoul Impartial Justice & Soul-Freeze Protocol. Aṣẹ.'
  });
}

export function soulFreezeStatus() {
  return {
    ...SOUL_FREEZE_PROTOCOL,
    radeCodes: Rade,
    activeFrozenAccounts: accounts.size,
    auditEvents: auditLog.length
  };
}

export function getJusticeAudit(limit = 50) {
  return auditLog.slice(-Math.max(1, Math.min(Number(limit) || 50, 500)));
}

export { Rade };
