import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAction,
  requiresConfirmation,
  validateConfirmation,
  actionBoundarySummary
} from './action-boundary.js';

test('classifies read and write actions', () => {
  assert.equal(classifyAction('inspect'), 'read');
  assert.equal(classifyAction('deploy'), 'write');
  assert.equal(classifyAction('unknown-action'), 'unknown');
});

test('read-only actions do not require confirmation', () => {
  const result = requiresConfirmation({
    action: 'inspect',
    target: 'kuyoung44/mercysoul',
    purpose: 'review repository state',
    authorized: true
  });

  assert.equal(result.allowed, true);
  assert.equal(result.confirmationRequired, false);
});

test('write actions stop until confirmation is supplied', () => {
  const proposal = {
    action: 'deploy',
    target: 'MercySoul Vercel project',
    purpose: 'publish approved build',
    authorized: true
  };

  const stopped = validateConfirmation(proposal);
  assert.equal(stopped.confirmationRequired, true);
  assert.equal(stopped.confirmed, false);
  assert.equal(stopped.executable, false);

  const confirmed = validateConfirmation(proposal, 'CONFIRM');
  assert.equal(confirmed.confirmed, true);
  assert.equal(confirmed.executable, true);
});

test('missing authorization blocks execution', () => {
  const result = actionBoundarySummary({
    action: 'modify',
    target: 'production',
    purpose: 'apply approved change',
    authorized: false
  }, 'CONFIRM');

  assert.equal(result.executable, false);
  assert.deepEqual(result.missing, ['authorization']);
});
