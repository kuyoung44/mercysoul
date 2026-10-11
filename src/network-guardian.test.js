import test from 'node:test';
import assert from 'node:assert/strict';
import { assessDeviceTrace } from './network-guardian.js';

test('requires explicit authorized scope and remains non-mutating', () => {
  const result = assessDeviceTrace({ devices: [{ label: 'router' }] });
  assert.equal(result.ok, false);
  assert.equal(result.externalMutation, false);
  assert.deepEqual(result.actionsTaken, []);
});

test('flags verified signals for review, not automatic action', () => {
  const result = assessDeviceTrace({
    authorizedScopeConfirmed: true,
    devices: [{ recordId: 'edge-1', label: 'API edge', evidenceVerified: true, trafficSpike: true }]
  });
  assert.equal(result.ok, true);
  assert.equal(result.devices[0].assessment, 'REVIEW_REQUIRED');
  assert.equal(result.guardrails.automaticBlocking, false);
  assert.equal(result.guardrails.deviceTakeover, false);
  assert.deepEqual(result.actionsTaken, []);
});

test('does not promote unverified signals into verified findings', () => {
  const result = assessDeviceTrace({
    authorizedScopeConfirmed: true,
    devices: [{ label: 'unknown', signals: ['connection spike'], evidenceVerified: false }]
  });
  assert.equal(result.devices[0].assessment, 'UNVERIFIED_SIGNAL');
  assert.match(result.devices[0].rationale, /not verified/i);
});

test('bounds records and handles malformed device entries', () => {
  const result = assessDeviceTrace({
    authorizedScopeConfirmed: true,
    devices: [...Array(105).fill(null), { label: 'ignored after limit' }]
  });
  assert.equal(result.summary.recordsReceived, 100);
  assert.equal(result.devices.length, 100);
});
