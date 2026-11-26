import test from 'node:test';
import assert from 'node:assert/strict';
import { personalBotStatus, runPersonalBot } from './personal-bot.js';

test('personal bot exposes human-centered boundaries', () => {
  const status = personalBotStatus();
  assert.equal(status.humanAgency, true);
  assert.equal(status.externalActions, 'confirmation-required');
  assert.equal(status.privacy, 'minimal-data by default');
});

test('personal bot keeps ordinary greetings available without an API key', async () => {
  const originalOpenAi = process.env.OPENAI_API_KEY;
  const originalPersonal = process.env.MERCYSOUL_PERSONAL_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.MERCYSOUL_PERSONAL_API_KEY;
  try {
    const result = await runPersonalBot({ message: 'hello', sessionId: 'test-greeting' });
    assert.equal(result.ok, true);
    assert.match(result.reply, /Hello/i);
  } finally {
    if (originalOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAi;
    if (originalPersonal === undefined) delete process.env.MERCYSOUL_PERSONAL_API_KEY;
    else process.env.MERCYSOUL_PERSONAL_API_KEY = originalPersonal;
  }
});

test('personal bot does not disguise an unconfigured AI provider with a canned task reply', async () => {
  const originalOpenAi = process.env.OPENAI_API_KEY;
  const originalPersonal = process.env.MERCYSOUL_PERSONAL_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.MERCYSOUL_PERSONAL_API_KEY;
  try {
    const result = await runPersonalBot({
      message: 'Create a detailed 30-day customer acquisition plan for a small shop.',
      sessionId: 'test-provider-missing'
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, 'AI_PROVIDER_NOT_CONFIGURED');
    assert.match(result.error, /OPENAI_API_KEY, MERCYSOUL_PERSONAL_API_KEY, or GEMINI_API_KEY/);
  } finally {
    if (originalOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAi;
    if (originalPersonal === undefined) delete process.env.MERCYSOUL_PERSONAL_API_KEY;
    else process.env.MERCYSOUL_PERSONAL_API_KEY = originalPersonal;
  }
});
