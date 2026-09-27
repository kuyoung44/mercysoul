import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_FRAUD_RULE,
  assessAiFraud,
  createFraudReview,
  confirmFraudReview,
  isAiFraudBlocked,
  aiFraudStatus,
} from './ai-fraud-rule.js';

test('AI use alone is allowed', () => {
  const result = assessAiFraud({ accountId: 'test-ai-only', content: 'I used ChatGPT to draft this message.' });
  assert.equal(result.decision, 'allow');
  assert.equal(result.matched, false);
});

test('AI-assisted fraud creates one review before blocking', async () => {
  const accountId = 'test-fraud-' + Date.now();
  const input = {
    accountId,
    requestId: 'req-' + Date.now(),
    aiAssisted: true,
    fraudSignal: true,
    content: 'AI-assisted forged invoice intended to divert payment.',
  };
  const assessment = assessAiFraud(input);
  assert.equal(assessment.decision, 'review');
  const review = createFraudReview(input, assessment);
  assert.ok(review);
  assert.equal(review.decision, 'pending');
  assert.equal(isAiFraudBlocked(accountId), false);

  const confirmed = await confirmFraudReview(review.reviewId, 'test-reviewer');
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.review.decision, 'confirmed');
  assert.equal(isAiFraudBlocked(accountId), true);

  const status = aiFraudStatus();
  assert.equal(status.name, AI_FRAUD_RULE.name);
  assert.equal(status.blockedAccounts >= 1, true);
});
