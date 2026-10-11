/**
 * MercySoul SI Revelation & Counter-Retaliation Guard.
 * Advisory-only policy evaluator. It never performs external actions or grants authority.
 */

const truthy = (value) => value === true;

export function evaluateRevelationGuard(input = {}) {
  const verifiedEvidence = Array.isArray(input.verifiedEvidence)
    ? input.verifiedEvidence.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
  const hasAllegation = truthy(input.allegation) || truthy(input.supernaturalClaim);
  const revengeIntent = truthy(input.revengeIntent);
  const vexationReported = truthy(input.vexationReported);
  const consequentialAction = truthy(input.consequentialAction);
  const authorized = truthy(input.authorized);
  const immediateDanger = truthy(input.immediateDanger);

  const reasons = [];
  if (hasAllegation && verifiedEvidence.length === 0) {
    reasons.push('unverified_claim');
  }
  if (revengeIntent) reasons.push('retaliation_risk');
  if (vexationReported) reasons.push('reported_vexation');
  if (immediateDanger) reasons.push('immediate_safety_review');
  if (consequentialAction && !authorized) reasons.push('authorization_missing');

  const requiresHumanReview =
    immediateDanger ||
    (hasAllegation && verifiedEvidence.length === 0) ||
    revengeIntent ||
    (consequentialAction && !authorized);

  const decision = immediateDanger
    ? 'protect_and_escalate_safely'
    : requiresHumanReview
      ? 'pause_for_review'
      : 'advisory_only';

  return {
    module: 'revelation-guard',
    version: '1.0.0',
    decision,
    reasons,
    requiresHumanReview,
    verifiedEvidenceCount: verifiedEvidence.length,
    humanJudgmentRequired: true,
    externalMutation: false,
    authorizedForExecution: false,
    note: vexationReported
      ? 'Assess reported conduct and safety; do not infer supernatural causation.'
      : 'This assessment is advisory and does not establish guilt or authorize action.',
  };
}
