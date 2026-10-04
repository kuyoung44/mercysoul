import crypto from 'node:crypto';
import {
  persistGovernanceApproval,
  persistGovernanceAudit,
  persistGovernanceDecision,
  persistGovernanceRecovery,
  persistGovernanceVerification,
} from '../supabase.js';

export const ALGORITHM_GOVERNANCE_POLICY = Object.freeze({
  key: 'algorithm-governance',
  version: '1.0.0',
  command: 'ILLUMINATE → VERIFY → PROTECT → ACT LAWFULLY → VERIFY → RECORD',
  lifecycle: ['RECEIVE', 'ROUTE', 'THINK', 'PLAN', 'GUARDIAN', 'APPROVE', 'EXECUTE', 'VERIFY', 'RECOVER', 'RECORD'],
});

const CONSEQUENT_ACTIONS = new Set([
  'external_mutation',
  'deployment',
  'payment',
  'permission_change',
  'data_deletion',
  'production_change',
  'account_action',
  'security_control_change',
]);

function text(value, fallback = '') {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function riskFor({ action, evidenceCount, protectedResource, lawful }) {
  if (!lawful) return 'CRITICAL';
  if (protectedResource || CONSEQUENT_ACTIONS.has(action)) return evidenceCount > 0 ? 'HIGH' : 'CRITICAL';
  if (evidenceCount === 0) return 'MEDIUM';
  return 'LOW';
}

export function evaluateAlgorithmGovernance(input = {}) {
  const requestId = text(input.requestId, crypto.randomUUID());
  const actor = text(input.actor, 'unknown-actor');
  const action = text(input.action, 'unspecified');
  const scope = text(input.scope, 'unspecified');
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const protectedResource = input.protectedResource === true || input.externalMutation === true;
  const approvalRequested = input.approvalRequested === true;
  const lawful = input.lawful !== false;
  const riskLevel = riskFor({ action, evidenceCount: evidence.length, protectedResource, lawful });
  const consequential = protectedResource || CONSEQUENT_ACTIONS.has(action);

  let decision = 'ALLOW';
  let reason = 'Verified evidence is present and no consequential approval gate was triggered.';

  if (!lawful) {
    decision = 'DENY';
    reason = 'The request is not marked lawful; MercySoul does not authorize execution.';
  } else if (consequential && evidence.length === 0) {
    decision = 'REVIEW';
    reason = 'Consequential execution requires verified evidence before execution.';
  } else if (consequential && !approvalRequested) {
    decision = 'REVIEW';
    reason = 'Consequential execution requires explicit approval before execution.';
  } else if (riskLevel === 'CRITICAL') {
    decision = 'REVIEW';
    reason = 'Critical-risk action requires human review.';
  }

  const requiresApproval = decision === 'REVIEW' && lawful;
  return {
    id: crypto.randomUUID(),
    requestId,
    actor,
    action,
    scope,
    evidence,
    decision,
    reason,
    riskLevel,
    policyKey: ALGORITHM_GOVERNANCE_POLICY.key,
    policyVersion: ALGORITHM_GOVERNANCE_POLICY.version,
    requiresApproval,
    executionStatus: 'not_started',
    verificationRequired: true,
    recoveryOnFailure: true,
    lifecycle: ALGORITHM_GOVERNANCE_POLICY.lifecycle,
    command: ALGORITHM_GOVERNANCE_POLICY.command,
  };
}

export async function evaluateAndRecordGovernance(input = {}) {
  const decision = evaluateAlgorithmGovernance(input);
  await persistGovernanceDecision(decision);
  await persistGovernanceAudit({
    id: crypto.randomUUID(),
    decisionId: decision.id,
    requestId: decision.requestId,
    eventType: 'governance_decision',
    actor: decision.actor,
    payload: { decision: decision.decision, reason: decision.reason, riskLevel: decision.riskLevel, policyVersion: decision.policyVersion },
  });
  return decision;
}

export async function recordGovernanceApproval({ decisionId, approver, approved, evidence = {} }) {
  if (!decisionId || !approver) throw new Error('decisionId and approver are required');
  const approval = {
    id: crypto.randomUUID(),
    decisionId,
    approver,
    approved: approved === true,
    evidence,
    approvedAt: new Date().toISOString(),
  };
  await persistGovernanceApproval(approval);
  await persistGovernanceAudit({
    id: crypto.randomUUID(),
    decisionId,
    eventType: approved === true ? 'approval_granted' : 'approval_denied',
    actor: approver,
    payload: evidence,
  });
  return approval;
}

export async function recordGovernanceVerification({ decisionId, phase, result, evidence = {} }) {
  if (!decisionId) throw new Error('decisionId is required');
  if (!['pre_execution', 'post_execution', 'recovery'].includes(phase)) throw new Error('Invalid verification phase');
  if (!['PASS', 'FAIL', 'REVIEW'].includes(result)) throw new Error('Invalid verification result');

  const verification = {
    id: crypto.randomUUID(),
    decisionId,
    phase,
    result,
    evidence,
    verifiedAt: new Date().toISOString(),
  };
  await persistGovernanceVerification(verification);

  if (result === 'FAIL') {
    await persistGovernanceRecovery({
      id: crypto.randomUUID(),
      decisionId,
      action: 'enter_recovery',
      reason: 'Verification failed; consequential completion is not certified.',
      evidence,
    });
  }

  await persistGovernanceAudit({
    id: crypto.randomUUID(),
    decisionId,
    eventType: `verification_${result.toLowerCase()}`,
    payload: { phase, evidence },
  });
  return verification;
}

export function algorithmGovernanceStatus() {
  return {
    enabled: true,
    policy: ALGORITHM_GOVERNANCE_POLICY.key,
    version: ALGORITHM_GOVERNANCE_POLICY.version,
    command: ALGORITHM_GOVERNANCE_POLICY.command,
    lifecycle: ALGORITHM_GOVERNANCE_POLICY.lifecycle,
    rule: 'No verified evidence → no consequential execution.',
    approvalRule: 'No approval → no consequential execution.',
    verificationRule: 'No post-action verification → no completion.',
    recoveryRule: 'Failed verification → RECOVER → REVERIFY.',
  };
}
