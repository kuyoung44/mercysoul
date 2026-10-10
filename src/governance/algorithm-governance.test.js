import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAlgorithmGovernance } from './algorithm-governance.js';

test('low risk action with evidence is allowed', () => {
  const result = evaluateAlgorithmGovernance({
    requestId: 'test-low',
    actor: 'tester',
    action: 'read',
    scope: 'public-data',
    evidence: [{ type: 'source', ref: 'test' }],
  });
  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.executionEligible, true);
  assert.equal(result.verificationRequired, true);
});

test('consequential action without approval is held for review', () => {
  const result = evaluateAlgorithmGovernance({
    requestId: 'test-high',
    actor: 'tester',
    action: 'deployment',
    scope: 'production',
    externalMutation: true,
    evidence: [{ type: 'verified-change', ref: 'test' }],
  });
  assert.equal(result.decision, 'REVIEW');
  assert.equal(result.requiresApproval, true);
  assert.equal(result.executionEligible, false);
});

test('approved consequential action becomes execution eligible', () => {
  const result = evaluateAlgorithmGovernance({
    requestId: 'test-approved',
    actor: 'tester',
    action: 'production_change',
    externalMutation: true,
    approved: true,
    evidence: [{ type: 'verified-change', ref: 'test' }],
  });
  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.approvalRecorded, true);
  assert.equal(result.executionEligible, true);
});

test('human judgment is always required', () => {
  const result = evaluateAlgorithmGovernance({
    requestId: 'test-human-judgment',
    actor: 'ai',
    action: 'recommendation',
    human_judgment_required: false,
    evidence: [{ type: 'source', ref: 'test' }],
  });
  assert.equal(result.human_judgment_required, true);
  assert.equal(result.decision, 'DENY');
  assert.equal(result.executionEligible, false);
});

test('AI must not claim religious authority or demand surrender of human judgment', () => {
  const result = evaluateAlgorithmGovernance({
    requestId: 'test-ai-authority',
    actor: 'ai',
    action: 'recommendation',
    claimsReligiousAuthority: true,
    demandsJudgmentSurrender: true,
    evidence: [{ type: 'source', ref: 'test' }],
  });
  assert.equal(result.decision, 'DENY');
  assert.equal(result.executionEligible, false);
});

test('AI must not present output as unquestionable truth', () => {
  const result = evaluateAlgorithmGovernance({
    requestId: 'test-unquestionable',
    actor: 'ai',
    action: 'recommendation',
    representsAsUnquestionableTruth: true,
    evidence: [{ type: 'source', ref: 'test' }],
  });
  assert.equal(result.decision, 'DENY');
  assert.equal(result.executionEligible, false);
});
