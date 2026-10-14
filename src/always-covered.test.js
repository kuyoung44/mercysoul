import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAlwaysCovered, alwaysCoveredStatus } from './always-covered.js';

test('allows scoped observation without claiming external authority', () => {
  const result = evaluateAlwaysCovered({ action: 'observe', scope: 'repository-read-only' });
  assert.equal(result.ok, true);
  assert.equal(result.externalMutation, false);
});

test('fails closed for consequential actions without authorization', () => {
  const result = evaluateAlwaysCovered({ action: 'deploy', scope: 'production' });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes('verification-required'));
  assert.ok(result.reasons.includes('explicit-authorization-required'));
  assert.ok(result.reasons.includes('human-approval-required'));
});

test('permits a verified and explicitly approved scoped proposal only', () => {
  const result = evaluateAlwaysCovered({
    action: 'modify', scope: 'src/example.js', verified: true,
    authorized: true, humanApproval: true
  });
  assert.equal(result.ok, true);
  assert.equal(result.decision, 'allow-within-declared-scope');
});

test('blocks unverified external permissions and permission expansion', () => {
  const result = evaluateAlwaysCovered({
    action: 'external-mutation', scope: 'third-party-service',
    verified: true, authorized: true, humanApproval: true,
    externalMutation: true, permissionGranted: false, permissionExpansion: true
  });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes('external-permission-not-verified'));
  assert.ok(result.reasons.includes('permission-expansion-prohibited'));
});

test('unknown actions and missing scope stop for review', () => {
  const result = evaluateAlwaysCovered({ action: 'do-anything' });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes('unknown-action'));
  assert.ok(result.reasons.includes('missing-explicit-scope'));
});

test('status is transparent that this is not infrastructure verification', () => {
  const status = alwaysCoveredStatus();
  assert.equal(status.policyOnly, true);
  assert.equal(status.infrastructureVerified, false);
  assert.equal(status.externalPermissionsVerified, false);
});

test('failure handling stops first, then permits recovery only after evidence is supplied', () => {
  const failed = evaluateAlwaysCovered({
    action: 'execute', scope: 'engine.run:smoke-test',
    verified: false, authorized: false, humanApproval: false
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.decision, 'stop-review');

  const recovered = evaluateAlwaysCovered({
    action: 'execute', scope: 'engine.run:smoke-test',
    verified: true, authorized: true, humanApproval: true
  });
  assert.equal(recovered.ok, true);
  assert.equal(recovered.scope, failed.scope);
});
