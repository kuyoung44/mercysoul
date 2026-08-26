import test from 'node:test';
import assert from 'node:assert/strict';

test('gaze module contract documents Screen On, Screen Off and heartbeat behavior', async () => {
  const source = await import('node:fs/promises');
  const text = await source.readFile(new URL('./gaze.js', import.meta.url), 'utf8');
  assert.match(text, /focused: true/);
  assert.match(text, /focused: false/);
  assert.match(text, /DEVICE_FOCUS_TTL_MS/);
  assert.match(text, /heartbeatTtlMs/);
});
