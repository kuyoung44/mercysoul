import test from 'node:test';
import assert from 'node:assert/strict';
import { selectMercySoulModel, mercySoulModelRouterStatus } from './model-router.js';

test('selects the configured primary model for general work', () => {
  const result = selectMercySoulModel({ env: { MERCYSOUL_MODEL_PRIMARY: 'google/gemini-test' } });
  assert.equal(result.ok, true);
  assert.equal(result.model, 'google/gemini-test');
  assert.equal(result.task, 'general');
});

test('selects a task-specific model profile', () => {
  const result = selectMercySoulModel({
    task: 'coding',
    env: {
      MERCYSOUL_MODEL_PRIMARY: 'google/gemini-fast',
      MERCYSOUL_MODEL_CODING: 'openai/gpt-coding',
    },
  });
  assert.equal(result.model, 'openai/gpt-coding');
  assert.equal(result.source, 'task_profile:coding');
});

test('allows an explicit model override without changing configuration', () => {
  const result = selectMercySoulModel({
    requestedModel: 'anthropic/claude-test',
    env: { MERCYSOUL_MODEL_PRIMARY: 'google/gemini-test' },
  });
  assert.equal(result.model, 'anthropic/claude-test');
  assert.equal(result.source, 'request_override');
});

test('fails closed when no model is configured', () => {
  const result = selectMercySoulModel({ env: {} });
  assert.equal(result.ok, false);
  assert.equal(result.decision, 'review');
});

test('fallback is reported but never invoked automatically', () => {
  const result = selectMercySoulModel({
    env: {
      MERCYSOUL_MODEL_PRIMARY: 'google/gemini-test',
      MERCYSOUL_MODEL_FALLBACK: 'openai/gpt-test',
    },
  });
  assert.equal(result.fallbackConfigured, true);
  assert.equal(result.fallbackModel, 'openai/gpt-test');
  assert.equal(result.automaticFallback, false);
});

test('status does not expose credentials', () => {
  const status = mercySoulModelRouterStatus({
    MERCYSOUL_MODEL_PRIMARY: 'google/gemini-test',
    GEMINI_API_KEY: 'never-return-this',
  });
  assert.equal(status.enabled, true);
  assert.equal(JSON.stringify(status).includes('never-return-this'), false);
  assert.equal(status.providerCalls, 0);
  assert.equal(status.executionAuthority, false);
});
