import test from 'node:test';
import assert from 'node:assert/strict';
import { MERCYSOUL_ENGINE, engineStatus } from './v8-engine.js';

test('MercySoul v8 engine smoke test', () => {
  assert.equal(MERCYSOUL_ENGINE.version, '8.0.0');
  assert.equal(MERCYSOUL_ENGINE.safetyFirst, true);
  assert.ok(MERCYSOUL_ENGINE.modules.includes('watchtower'));
  assert.ok(MERCYSOUL_ENGINE.modules.includes('spirit-protocol'));
  assert.ok(MERCYSOUL_ENGINE.modules.includes('sovereign-rest'));

  const status = engineStatus();
  assert.equal(status.engine.version, '8.0.0');
  assert.ok(status.watchtower);
  assert.ok(status.jurisdiction);
  assert.ok(status.spirit);
  assert.ok(status.sovereignRest);
});
