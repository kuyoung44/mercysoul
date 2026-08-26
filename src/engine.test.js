import test from 'node:test';
import assert from 'node:assert/strict';
import { MERCYSOUL_ENGINE, engineStatus } from './engine/v8-engine.js';

test('MercySoul v8 engine loads and reports active', () => {
  assert.equal(MERCYSOUL_ENGINE.version, '8.0.0');
  assert.equal(MERCYSOUL_ENGINE.safetyFirst, true);
  assert.equal(engineStatus().engine.version, '8.0.0');
  assert.equal(engineStatus().watchtower.version, '7.0.0');
  assert.equal(engineStatus().spirit.version, '8.0.0');
  assert.equal(engineStatus().sovereignRest.version, 'infinity');
});
