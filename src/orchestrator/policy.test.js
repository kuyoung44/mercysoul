import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExecutionGate } from './policy.js';

test('mutation is blocked even when execute is true', () => {
  const result = evaluateExecutionGate({ requiresApproval: true }, { execute: true });
  assert.equal(result.allowed, false);
  assert.equal(result.execution, 'approval-required');
  assert.equal(result.executionPerformed, false);
});

test('read-only plan does not execute without explicit execute true', () => {
  const result = evaluateExecutionGate({ requiresApproval: false }, {});
  assert.equal(result.allowed, false);
  assert.equal(result.execution, 'plan-only');
});

test('explicitly executed read-only plan may proceed', () => {
  const result = evaluateExecutionGate({ requiresApproval: false }, { execute: true });
  assert.equal(result.allowed, true);
  assert.equal(result.execution, 'read-only-execution');
});
