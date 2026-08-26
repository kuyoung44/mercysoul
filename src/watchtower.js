import crypto from 'node:crypto';

export const WATCHTOWER_PROTOCOL = Object.freeze({
  name: 'MercySoul Global Watchtower Protocol',
  version: '7.0.0',
  scope: 'application-network',
  principles: ['individual evaluation', 'behavior-based moderation', 'equal treatment', 'privacy minimization', 'reversible enforcement'],
  identitySignals: ['accountId', 'privacy-preserving-ip-hash'],
  decisions: ['allow', 'review', 'freeze'],
  permanentIdentityJudgment: false,
  rawIpRetention: false,
  humanReviewForAmbiguous: true,
  defaultFreezeMs: 24 * 60 * 60 * 1000,
  auditRetentionMs: 30 * 24 * 60 * 60 * 1000
});

const records = new Map();
const audit = [];

function secret() {
  return process.env.WATCHTOWER_HASH_SECRET || 'mercysoul-watchtower-local-secret';
}

function hash(value) {
  if (!value) return null;
  return crypto.createHmac('sha256', secret()).update(String(value)).digest('hex');
}

function clientIp(req) {
  const forwarded = req.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || null;
}

export function identifyRequest(req) {
  const accountId = req.body?.accountId || req.get('x-account-id') || null;
  return {
    accountId: accountId ? String(accountId) : null,
    ipHash: hash(clientIp(req))
  };
}

function key(identity) {
  return identity.accountId ? `account:${identity.accountId}` : identity.ipHash ? `ip:${identity.ipHash}` : null;
}

function prune() {
  const cutoff = Date.now() - WATCHTOWER_PROTOCOL.auditRetentionMs;
  while (audit.length && Date.parse(audit[0].timestamp) < cutoff) audit.shift();
}

export function recordWatchtowerEvent(identity, assessment = {}, requestId = null) {
  const now = new Date();
  const k = key(identity);
  const decision = assessment.decision === 'remove' || assessment.hardSafety ? 'freeze' : assessment.decision === 'review' ? 'review' : 'allow';
  const event = {
    id: crypto.randomUUID(),
    requestId,
    timestamp: now.toISOString(),
    accountId: identity.accountId,
    ipHash: identity.ipHash,
    decision,
    categories: assessment.categories || [],
    riskScore: assessment.riskScore ?? null,
    reasons: assessment.reasons || []
  };
  if (k) {
    const previous = records.get(k) || { firstSeenAt: now.toISOString(), events: 0, lastDecision: 'allow', freezeUntil: null };
    previous.events += 1;
    previous.lastDecision = decision;
    if (decision === 'freeze') previous.freezeUntil = new Date(Date.now() + WATCHTOWER_PROTOCOL.defaultFreezeMs).toISOString();
    records.set(k, previous);
  }
  audit.push(event);
  prune();
  return event;
}

export function getWatchtowerStatus(identity) {
  const k = key(identity);
  const record = k ? records.get(k) : null;
  if (!record) return { status: 'active', decision: 'allow', known: false };
  if (record.freezeUntil && Date.now() >= Date.parse(record.freezeUntil)) {
    record.freezeUntil = null;
    record.lastDecision = 'allow';
  }
  return {
    status: record.freezeUntil ? 'frozen' : 'active',
    decision: record.freezeUntil ? 'freeze' : record.lastDecision,
    known: true,
    firstSeenAt: record.firstSeenAt,
    events: record.events,
    freezeUntil: record.freezeUntil
  };
}

export function watchtowerMiddleware(req, res, next) {
  if (req.method === 'GET' || req.path === '/health') return next();
  const identity = identifyRequest(req);
  const status = getWatchtowerStatus(identity);
  req.watchtower = { identity, status };
  if (status.status === 'frozen') {
    return res.status(423).json({
      ok: false,
      error: 'WATCHTOWER_FREEZE',
      requestId: req.requestId,
      watchtower: { ...status, protocol: WATCHTOWER_PROTOCOL.version },
      notice: 'Access is temporarily frozen because of a previously recorded safety violation. Review and re-entry are supported.'
    });
  }
  return next();
}

export function watchtowerStatus() {
  prune();
  return {
    ...WATCHTOWER_PROTOCOL,
    trackedSubjects: records.size,
    auditEvents: audit.length
  };
}

export function getWatchtowerAudit(limit = 50) {
  prune();
  return audit.slice(-Math.max(1, Math.min(Number(limit) || 50, 500)));
}
