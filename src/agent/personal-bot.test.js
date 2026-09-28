import test from 'node:test';
import assert from 'node:assert/strict';
import { personalBotStatus, runPersonalBot } from './personal-bot.js';

test('personal bot exposes human-centered boundaries', () => {
  const status = personalBotStatus();
  assert.equal(status.humanAgency, true);
  assert.equal(status.externalActions, 'confirmation-required');
  assert.equal(status.privacy, 'minimal-data by default');
});

test('personal bot has a safe local fallback without an API key', async () => {
  const result = await runPersonalBot({ message: 'hello', sessionId: 'test-session' });
  assert.equal(result.ok, true);
  assert.match(result.reply, /Hello/i);
});
