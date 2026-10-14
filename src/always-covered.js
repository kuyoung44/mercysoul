const CONSEQUENTIAL_ACTIONS = new Set([
  'modify', 'execute', 'deploy', 'delete', 'permission-change', 'external-mutation'
]);
const KNOWN_ACTIONS = new Set(['observe', 'verify', 'protect', ...CONSEQUENTIAL_ACTIONS]);

export const ALWAYS_COVERED_POLICY = Object.freeze({
  id: 'MERCYSOUL-ALWAYS-COVERED',
  version: '1.0.0',
  sequence: ['COVER', 'VERIFY', 'PROTECT', 'AUTHORIZE', 'EXECUTE', 'VERIFY_AGAIN', 'RECORD', 'MAINTAIN'],
  failClosed: true,
  humanJudgmentRequired: true,
  permissionExpansionAllowed: false,
  policyOnly: true
});

/**
 * Evaluates whether a proposed operation satisfies the Always Covered rule.
 * This is a policy evaluator only; it does not perform the operation, inspect
 * external permissions, or prove that infrastructure is secure.
 */
export function evaluateAlwaysCovered(input = {}) {
  const action = typeof input.action === 'string' ? input.action : 'observe';
  const scope = typeof input.scope === 'string' ? input.scope.trim() : '';
  const reasons = [];

  if (!KNOWN_ACTIONS.has(action)) reasons.push('unknown-action');
  if (!scope) reasons.push('missing-explicit-scope');

  const consequential = CONSEQUENTIAL_ACTIONS.has(action);
  if (consequential && input.verified !== true) reasons.push('verification-required');
  if (consequential && input.authorized !== true) reasons.push('explicit-authorization-required');
  if (consequential && input.humanApproval !== true) reasons.push('human-approval-required');

  if (input.externalMutation === true && input.permissionGranted !== true) {
    reasons.push('external-permission-not-verified');
  }
  if (input.permissionExpansion === true) reasons.push('permission-expansion-prohibited');
  if (input.risk === 'high' && input.humanApproval !== true) reasons.push('high-risk-human-review-required');

  return Object.freeze({
    ok: reasons.length === 0,
    decision: reasons.length === 0 ? 'allow-within-declared-scope' : 'stop-review',
    policy: ALWAYS_COVERED_POLICY.id,
    version: ALWAYS_COVERED_POLICY.version,
    action,
    scope: scope || null,
    consequential,
    externalMutation: input.externalMutation === true,
    permissionExpansion: false,
    humanJudgmentRequired: true,
    reasons
  });
}

export function alwaysCoveredStatus() {
  return {
    ...ALWAYS_COVERED_POLICY,
    enforcement: 'policy-evaluator-available',
    infrastructureVerified: false,
    externalPermissionsVerified: false,
    lastEvaluation: null
  };
}
