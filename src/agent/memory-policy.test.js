import test from 'node:test';
import assert from 'node:assert/strict';
import {
  prepareMemoryObservation,
  buildMemoryIndex,
  selectMemoryObservations,
  memoryPolicyStatus,
} from './memory-policy.js';

test('memory requires explicit user opt-in', () => {
  assert.equal(prepareMemoryObservation({ type: 'preference', content: 'Use concise replies' }).reason, 'user_opt_in_required');
});

test('private and secret-bearing content is excluded', () => {
  assert.equal(prepareMemoryObservation({ userOptIn: true, private: true, type: 'summary', content: 'not for memory' }).reason, 'private_content_excluded');
  assert.equal(prepareMemoryObservation({ userOptIn: true, type: 'project_fact', content: 'api_key=abc123456789012345' }).reason, 'sensitive_content_excluded');
});

test('approved safe content becomes a provenance-labelled candidate', () => {
  const result = prepareMemoryObservation({
    userOptIn: true,
    type: 'preference',
    content: 'Keep approval before publishing',
    tags: ['governance', 'governance'],
    projectId: 'mercysoul',
  });
  assert.equal(result.stored, true);
  assert.equal(result.observation.provenance, 'explicit-user-approved');
  assert.deepEqual(result.observation.tags, ['governance']);
});

test('progressive disclosure returns compact index then selected full records', () => {
  const records = [
    { id: 'a', type: 'decision', content: 'Keep production deploys approval-gated', createdAt: '2026-10-01' },
    { id: 'b', type: 'lesson', content: 'Use idempotency keys for retries' },
  ];
  const index = buildMemoryIndex(records, { limit: 1 });
  assert.equal(index.length, 1);
  assert.ok(index[0].preview.length <= 180);
  assert.deepEqual(selectMemoryObservations(records, ['b']).map((item) => item.id), ['b']);
});

test('persistence is explicitly reported as not configured', () => {
  assert.equal(memoryPolicyStatus().persistence, 'not_configured');
  assert.equal(memoryPolicyStatus().externalMutation, false);
});
