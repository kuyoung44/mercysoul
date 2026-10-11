import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRevelationGuard } from './revelation-guard.js';

test('unverified spiritual allegation pauses for review without declaring it true', () => {
  const result = evaluateRevelationGuard({ allegation: true, supernaturalClaim: true });
  assert.equal(result.decision, 'pause_for_review');
  assert.equal(result.requiresHumanReview, true);
  assert.equal(result.authorizedForExecution, false);
  assert.ok(result.reasons.includes('unverified_claim'));
});

test('revenge intent triggers review and never authorizes retaliation', () => {
  const result = evaluateRevelationGuard({ revengeIntent: true });
  assert.equal(result.decision, 'pause_for_review');
  assert.ok(result.reasons.includes('retaliation_risk'));
  assert.equal(result.externalMutation, false);
});

test('consequential action without authorization is paused', () => {
  const result = evaluateRevelationGuard({ consequentialAction: true, authorized: false });
  assert.equal(result.decision, 'pause_for_review');
  assert.ok(result.reasons.includes('authorization_missing'));
});

test('immediate danger prioritizes protection and safe escalation', () => {
  const result = evaluateRevelationGuard({ immediateDanger: true });
  assert.equal(result.decision, 'protect_and_escalate_safely');
  assert.equal(result.requiresHumanReview, true);
});

test('verified evidence avoids treating a claim as automatically unverified', () => {
  const result = evaluateRevelationGuard({
    allegation: true,
    verifiedEvidence: ['timestamped message preserved'],
  });
  assert.equal(result.verifiedEvidenceCount, 1);
  assert.equal(result.reasons.includes('unverified_claim'), false);
  assert.equal(result.authorizedForExecution, false);
});

test('ordinary input remains advisory and cannot authorize execution', () => {
  const result = evaluateRevelationGuard({});
  assert.equal(result.decision, 'advisory_only');
  assert.equal(result.humanJudgmentRequired, true);
  assert.equal(result.authorizedForExecution, false);
});
