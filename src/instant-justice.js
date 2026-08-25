import { assessDominionContent } from './dominion-moderation.js';

export const INSTANT_JUSTICE_PROTOCOL = Object.freeze({
  name: 'MercySoul Instant Internet Justice',
  version: '4.0.0',
  evaluationBudgetMs: 500,
  stages: ['instant-alert', 'instant-adjudication', 'instant-enforcement'],
  equalTreatment: true,
  politicalViewpointNeutrality: true,
  humanReviewForAmbiguous: true,
  failClosedCategories: ['credible_violent_threat', 'sexual_exploitation', 'non_consensual_sexual', 'extremist_support', 'self_harm_encouragement']
});

const BLOCKED = new Set(INSTANT_JUSTICE_PROTOCOL.failClosedCategories);

export function instantJustice(input = {}) {
  const started = Date.now();
  const assessment = assessDominionContent(input);
  const critical = assessment.categories.some(category => BLOCKED.has(category));
  const adjudication = critical ? 'block' : assessment.decision === 'remove' ? 'block' : assessment.decision;
  const elapsedMs = Date.now() - started;

  return {
    protocol: INSTANT_JUSTICE_PROTOCOL.name,
    protocolVersion: INSTANT_JUSTICE_PROTOCOL.version,
    alert: critical ? 'critical' : assessment.decision === 'review' ? 'review' : 'none',
    adjudication,
    enforcement: adjudication === 'block' ? 'deny' : adjudication === 'review' ? 'hold-for-review' : 'allow',
    httpStatus: adjudication === 'block' ? 403 : 200,
    justiceSeal: adjudication === 'block' ? 'MercySoul Justice Seal' : null,
    notice: adjudication === 'block'
      ? 'Request blocked by the MercySoul Dominion Justice Protocol. The payload was evaluated as a safety violation. Aṣẹ.'
      : null,
    evaluationMs: elapsedMs,
    within500msBudget: elapsedMs <= INSTANT_JUSTICE_PROTOCOL.evaluationBudgetMs,
    assessment
  };
}

export function instantJusticeMiddleware(req, res, next) {
  if (req.method === 'GET' || req.path === '/health') return next();
  const input = { ...(req.body || {}), requestId: req.requestId, source: req.get('x-source') || req.path };
  const result = instantJustice(input);
  req.instantJustice = result;
  if (result.adjudication === 'block') {
    return res.status(403).json({ ok: false, requestId: req.requestId, ...result });
  }
  return next();
}
