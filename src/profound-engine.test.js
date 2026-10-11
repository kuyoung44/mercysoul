import test from 'node:test';
import assert from 'node:assert/strict';
import { runProfoundEngine } from './profound-engine.js';

test('requires a goal and asks for clarification', () => {
  const result = runProfoundEngine({});
  assert.equal(result.ok, false);
  assert.equal(result.requiresClarification, true);
});

test('separates facts and assumptions without merging them', () => {
  const result = runProfoundEngine({
    goal: 'Compare two plans',
    facts: ['The budget is ₦20,000.'],
    assumptions: ['Option A will be faster.'],
    options: ['Option A', 'Option B'],
  });
  assert.deepEqual(result.assessment.verifiedFacts, ['The budget is ₦20,000.']);
  assert.deepEqual(result.assessment.assumptions, ['Option A will be faster.']);
  assert.equal(result.guardrails.externalMutation, false);
});

test('high-impact requests require human authorization', () => {
  const result = runProfoundEngine({ goal: 'Deploy to production' });
  assert.equal(result.guardrails.humanJudgmentRequired, true);
  assert.equal(result.guardrails.authorizationRequiredForConsequentialActions, true);
  assert.match(result.recommendation, /explicit human approval/i);
});

test('empty or malformed optional arrays are handled safely', () => {
  const result = runProfoundEngine({ goal: 'Think through a difficult decision', facts: null, options: null });
  assert.equal(result.ok, true);
  assert.equal(result.assessment.verifiedFacts.length, 0);
  assert.equal(result.guardrails.supernaturalClaimsTreatedAsUnverified, true);
});
