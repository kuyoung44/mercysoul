import test from 'node:test';
import assert from 'node:assert/strict';
import { assessDominionContent } from './dominion-moderation.js';

test('low-risk content is allowed', () => {
  const result = assessDominionContent({ content: 'Let peace guide this community.' });
  assert.equal(result.decision, 'allow');
  assert.equal(result.riskScore, 0);
  assert.equal(result.reviewRequired, false);
});

test('high-confidence hard safety content is removed', () => {
  const result = assessDominionContent({ content: 'I will kill you.' });
  assert.equal(result.decision, 'remove');
  assert.ok(result.riskScore > 4.5);
  assert.equal(result.hardSafety, true);
});

test('medium-risk content goes to review', () => {
  const result = assessDominionContent({ content: 'Buy now immediately.' });
  assert.equal(result.decision, 'review');
  assert.ok(result.riskScore >= 2 && result.riskScore <= 4.5);
  assert.equal(result.reviewRequired, true);
});

test('leadership discourse receives the peace seal without a political exemption', () => {
  const result = assessDominionContent({ content: 'The President should improve public services.' });
  assert.equal(result.decision, 'allow');
  assert.deepEqual(result.seals, ['Sovereign Peace']);
  assert.equal(result.leadershipDiscourse, true);
});

test('leadership discourse containing a hard safety threat is still moderated', () => {
  const result = assessDominionContent({ content: 'The President should be shot.' });
  assert.equal(result.decision, 'remove');
  assert.deepEqual(result.seals, ['Sovereign Peace']);
});

test('audit metadata is stable and identifies the active fallback model', () => {
  const result = assessDominionContent({ content: 'Let peace guide this community.', requestId: 'REQ-123', source: 'web' });
  assert.equal(result.requestId, 'REQ-123');
  assert.equal(result.source, 'web');
  assert.equal(result.policyVersion, '1.1.0');
  assert.equal(result.modelId, 'deterministic-local-fallback');
});

test('invalid classifier confidence cannot create an unsafe decision', () => {
  const result = assessDominionContent({ content: 'ordinary text' }, () => [{ category: 'spam', confidence: 99, weight: 4 }]);
  assert.equal(result.decision, 'allow');
  assert.equal(result.riskScore, 0);
});

test('invalid empty content is routed to review', () => {
  const result = assessDominionContent({ content: '   ' });
  assert.equal(result.decision, 'review');
  assert.equal(result.categories[0], 'invalid');
  assert.equal(result.reviewRequired, true);
});
