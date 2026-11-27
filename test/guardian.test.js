import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkBudget, getUsage, readSafeCache, resetGuardianStateForTests,
  runGuardedRequest, selectModel, writeSafeCache,
} from '../src/resource-guardian/guardian.js';

test.beforeEach(() => resetGuardianStateForTests());

test('uses deterministic local processing without an AI call', async () => {
  let called = false;
  const result = await runGuardedRequest({ authenticatedUserId: 'u1', operation: 'sum', args: { values: [2, 3] } }, {
    generate: async () => { called = true; },
  });
  assert.equal(result.route, 'local');
  assert.equal(result.result, 5);
  assert.equal(called, false);
});

test('requires an authenticated user before processing', async () => {
  const result = await runGuardedRequest({ prompt: 'hello' }, { generate: async () => ({ text: 'hi' }) });
  assert.equal(result.reason, 'authenticated_user_required');
});

test('blocks unapproved models when an allowlist is configured', () => {
  assert.deepEqual(
    selectModel({ requestedModel: 'unapproved', config: { allowedModels: ['approved'] } }),
    { ok: false, reason: 'model_not_allowlisted' },
  );
});

test('pauses requests that exceed configured budget', async () => {
  const result = await runGuardedRequest({
    authenticatedUserId: 'u1',
    prompt: 'x'.repeat(200),
    requestedModel: 'm1',
    config: { defaultModel: 'm1', maxInputTokens: 10, maxRequestTokens: 20, maxOutputTokens: 10 },
  }, { generate: async () => ({ text: 'must not run' }) });
  assert.equal(result.status, 'approval_required');
  assert.equal(result.executionPerformed, false);
});

test('does not cache private content', async () => {
  let calls = 0;
  const input = {
    authenticatedUserId: 'u1', projectId: 'p1', prompt: 'private prompt',
    private: true, cache: true, cacheClass: 'public', requestedModel: 'm1',
    config: { defaultModel: 'm1' },
  };
  const adapters = {
    generate: async () => {
      calls += 1;
      return { text: 'private answer', cacheSafe: true, usage: { inputTokens: 3, outputTokens: 2 } };
    },
  };
  await runGuardedRequest(input, adapters);
  await runGuardedRequest(input, adapters);
  assert.equal(calls, 2);
});

test('cache is bounded and returns only an explicitly matching key', () => {
  writeSafeCache('owner-a-project-x', 'safe result', { cacheTtlMs: 5000, cacheMaxEntries: 5 });
  assert.equal(readSafeCache('owner-a-project-x').value, 'safe result');
  assert.equal(readSafeCache('owner-b-project-x').hit, false);
});

test('consequential external action pauses for approval and does not call model', async () => {
  let called = false;
  const result = await runGuardedRequest({
    authenticatedUserId: 'u1', prompt: 'deploy production', requestedModel: 'm1',
    requiresExternalAction: true, config: { defaultModel: 'm1' },
  }, { generate: async () => { called = true; } });
  assert.equal(result.status, 'approval_required');
  assert.equal(called, false);
});

test('budget estimator enforces input plus output and daily ceilings', () => {
  const result = checkBudget({
    prompt: 'a'.repeat(400),
    maxOutputTokens: 50,
    usageToday: 90,
    config: { maxInputTokens: 200, maxOutputTokens: 100, maxRequestTokens: 250, maxDailyTokens: 200 },
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('daily_token_budget_exceeded'));
});

test('usage accounting is separated by authenticated owner', async () => {
  await runGuardedRequest({
    authenticatedUserId: 'owner-a', prompt: 'hello', requestedModel: 'm1',
    config: { defaultModel: 'm1' },
  }, { generate: async () => ({ text: 'ok', usage: { inputTokens: 4, outputTokens: 2 } }) });
  assert.equal(getUsage({ userId: 'owner-a' }).totalTokens, 6);
  assert.equal(getUsage({ userId: 'owner-b' }).totalTokens, 0);
});
