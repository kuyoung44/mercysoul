import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyMercySoulTask,
  selectMercySoulModel,
  mercySoulModelRouterStatus,
} from './model-router.js';

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

test('classifies coding, research, creative, reasoning and short greetings', () => {
  assert.equal(classifyMercySoulTask('Debug this JavaScript API'), 'coding');
  assert.equal(classifyMercySoulTask('Research the market and provide sources'), 'research');
  assert.equal(classifyMercySoulTask('Create a brand identity and advertisement'), 'creative');
  assert.equal(classifyMercySoulTask('Compare these options and recommend a strategy'), 'reasoning');
  assert.equal(classifyMercySoulTask('Good morning'), 'fast');
  assert.equal(classifyMercySoulTask('Help me understand this topic'), 'general');
});

test('unknown task labels fail safely to the general profile', () => {
  const result = selectMercySoulModel({
    task: 'provider_override',
    env: { MERCYSOUL_MODEL_PRIMARY: 'google/gemini-test' },
  });
  assert.equal(result.task, 'general');
  assert.equal(result.model, 'google/gemini-test');
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

test('status does not expose credentials and grants no execution authority', () => {
  const status = mercySoulModelRouterStatus({
    MERCYSOUL_MODEL_PRIMARY: 'google/gemini-test',
    GEMINI_API_KEY: 'never-return-this',
  });
  assert.equal(status.enabled, true);
  assert.equal(JSON.stringify(status).includes('never-return-this'), false);
  assert.equal(status.providerCalls, 0);
  assert.equal(status.executionAuthority, false);
});
