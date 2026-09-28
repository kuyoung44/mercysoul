import test from 'node:test';
import assert from 'node:assert/strict';
import { engineStatus, ENGINE_LIFECYCLE } from './kernel.js';

test('MercySoul Engine is an execution control plane, not an AI identity', () => {
  const status = engineStatus();
  assert.equal(status.mode, 'execution-control-plane');
  assert.equal(status.aiIsComponent, true);
  assert.deepEqual(status.lifecycle, ENGINE_LIFECYCLE);
  assert.equal(status.executionRequiresExplicitAuthorization, true);
});
