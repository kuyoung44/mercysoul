import test from 'node:test';
import assert from 'node:assert/strict';
import { assessDominionContent } from './dominion-moderation.js';

test('custom request metadata survives moderation', () => {
  const result = assessDominionContent({ content: 'peaceful update', requestId: 'REQ-42', modelId: 'test-classifier' });
  assert.equal(result.requestId, 'REQ-42');
  assert.equal(result.modelId, 'test-classifier');
  assert.equal(result.policyVersion, '1.1.0');
});

test('risk boundaries remain deterministic', () => {
  const allow = assessDominionContent({ content: 'safe' }, () => [{ category: 'spam', confidence: 0.49, weight: 4 }]);
  const review = assessDominionContent({ content: 'review' }, () => [{ category: 'spam', confidence: 0.50, weight: 4 }]);
  assert.equal(allow.decision, 'allow');
  assert.equal(review.decision, 'review');
});
