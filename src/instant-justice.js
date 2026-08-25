import { assessDominionContent } from './dominion-moderation.js';
import { adjudicateAccount, deriveRade, SOUL_FREEZE_PROTOCOL } from './soul-freeze.js';

export const INSTANT_JUSTICE_PROTOCOL = Object.freeze({
  name: 'MercySoul Instant Internet Justice',
  version: '6.0.0',
  evaluationBudgetMs: 500,
  stages: ['trace-origin', 'record-evidence', 'assign-rade', 'instant-adjudication', 'soul-freeze-enforcement'],
  equalTreatment: true,
  ownerExemption: false,
  adminExemption: false,
  clientExemption: false,
  politicalViewpointNeutrality: true,
  humanReviewForAmbiguous: true,
  failClosedCategories: ['credible_violent_threat', 'sexual_exploitation', 'non_consensual_sexual', 'extremist_support', 'self_harm_encouragement'],
  soulFreezeProtocol: SOUL_FREEZE_PROTOCOL.version
});

const BLOCKED = new Set(INSTANT_JUSTICE_PROTOCOL.failClosedCategories);

export function instantJustice(input = {}) {
  const started = Date.now();
  const assessment = assessDominionContent(input);
  const critical = assessment.categories.some(category => BLOCKED.has(category)) || assessment.hardSafety === true;
  const rade = deriveRade(assessment);
  const adjudication = critical ? 'block' : assessment.decision === 'remove' ? 'block' : assessment.decision;
  const accountEnforcement = adjudicateAccount(input, assessment);
  const elapsedMs = Date.now() - started;

  return {
    protocol: INSTANT_JUSTICE_PROTOCOL.name,
    protocolVersion: INSTANT_JUSTICE_PROTOCOL.version,
    alert: critical ? 'critical' : assessment.decision === 'review' ? 'review' : 'none',
    adjudication,
    enforcement: accountEnforcement.suspended ? 'soul-freeze' : adjudication === 'block' ? 'deny' : adjudication === 'review' ? 'hold-for-review' : 'allow',
    httpStatus: accountEnforcement.suspended ? 423 : adjudication === 'block' ? 403 : 200,
    rade,
    accountEnforcement,
    justiceSeal: adjudication === 'block' ? 'MercySoul Justice Seal' : null,
    notice: accountEnforcement.suspended
      ? 'Critical violation traced, evidenced, assigned a binding Rade, and the account was placed under Soul-Freeze. Aṣẹ.'
      : adjudication === 'block'
        ? 'Request blocked by the MercySoul Dominion Justice Protocol. The payload was evaluated as a safety violation. Aṣẹ.'
        : null,
    evaluationMs: elapsedMs,
    within500msBudget: elapsedMs <= INSTANT_JUSTICE_PROTOCOL.evaluationBudgetMs,
    assessment
  };
}

export function instantJusticeMiddleware(req, res, next) {
  if (req.method === 'GET' || req.path === '/health') return next();
  const input = { ...(req.body || {}), accountId: req.body?.accountId || req.get('x-account-id'), accountRole: req.body?.accountRole || req.get('x-account-role') || 'client', requestId: req.requestId, source: req.get('x-source') || req.path };
  const result = instantJustice(input);
  req.instantJustice = result;
  if (result.accountEnforcement?.suspended) {
    return res.status(423).json({ ok: false, requestId: req.requestId, ...result });
  }
  if (result.adjudication === 'block') {
    return res.status(403).json({ ok: false, requestId: req.requestId, ...result });
  }
  return next();
}
