import test from 'node:test';
import assert from 'node:assert/strict';
import { SMARTTHINGS_PROTOCOL } from './smartthings.js';

test('SmartThings integration uses OAuth2 and scoped device control', () => {
  assert.equal(SMARTTHINGS_PROTOCOL.productionAuth, 'OAuth2');
  assert.ok(SMARTTHINGS_PROTOCOL.scopes.includes('r:devices:*'));
  assert.ok(SMARTTHINGS_PROTOCOL.scopes.includes('x:devices:*'));
  assert.equal(SMARTTHINGS_PROTOCOL.externalControl, true);
});
