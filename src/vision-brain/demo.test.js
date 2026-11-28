import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVisionBrainInput, normalizeVisionBrainMode, visionBrainDemoStatus, runVisionBrainDemo, buildVisionBrainInstructions } from './demo.js';

test('rejects empty and non-string input', () => { assert.equal(normalizeVisionBrainInput('').ok, false); assert.equal(normalizeVisionBrainInput(null).ok, false); });
test('trims valid input and enforces length limit', () => { assert.deepEqual(normalizeVisionBrainInput('  Build a plan  '), { ok: true, input: 'Build a plan' }); assert.equal(normalizeVisionBrainInput('x'.repeat(4001)).ok, false); });
test('reports sample-only mode when server credentials are absent', () => { assert.equal(visionBrainDemoStatus({}).configured, false); assert.equal(visionBrainDemoStatus({}).externalMutation, false); });
test('does not call provider when model configuration is absent', async () => { const result = await runVisionBrainDemo('Help me plan', { env: {} }); assert.equal(result.code, 'MODEL_NOT_CONFIGURED'); });
test('returns live response through an injected client', async () => {
 const result = await runVisionBrainDemo('Help me plan', { mode: 'engineer', env: { OPENAI_API_KEY: 'test-key', VISION_BRAIN_OPENAI_MODEL: 'test-model' }, createClient: async () => ({ responses: { create: async (args) => { assert.equal(args.model, 'test-model'); assert.match(args.instructions, /senior software engineer/i); return { id: 'resp_test', output_text: 'A practical plan.' }; } } }) });
 assert.equal(result.ok, true); assert.equal(result.mode, 'live'); assert.equal(result.intelligenceMode, 'engineer'); assert.equal(result.outputText, 'A practical plan.'); assert.equal(result.externalMutation, false);
});
test('sanitizes provider errors', async () => { const result = await runVisionBrainDemo('Help me plan', { env: { OPENAI_API_KEY: 'test-key', VISION_BRAIN_OPENAI_MODEL: 'test-model' }, createClient: async () => ({ responses: { create: async () => { throw new Error('secret provider detail'); } } }) }); assert.equal(result.code, 'MODEL_REQUEST_FAILED'); assert.doesNotMatch(result.error, /secret provider detail/); });
test('allows only the four declared intelligence modes and safely defaults unknown values', () => {
 assert.deepEqual(['strategist','engineer','creative','analyst'].map(normalizeVisionBrainMode), ['strategist','engineer','creative','analyst']);
 assert.equal(normalizeVisionBrainMode('admin'), 'strategist');
 assert.match(buildVisionBrainInstructions('creative'), /creative director/i);
});
