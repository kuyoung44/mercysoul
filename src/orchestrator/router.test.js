import test from 'node:test';
import assert from 'node:assert/strict';
import { routeCommand } from './router.js';

test('explicit read-only inspection does not require mutation approval', () => {
  const plan = routeCommand('check GitHub repository status');
  assert.equal(plan.selectedTools.some((tool) => tool.id === 'github'), true);
  assert.equal(plan.requiresApproval, false);
});

test('deployment request always requires approval', () => {
  const plan = routeCommand('deploy MercySoul to Vercel');
  assert.equal(plan.selectedTools.some((tool) => tool.id === 'vercel'), true);
  assert.equal(plan.requiresApproval, true);
});

test('mixed inspection and mutation request requires approval', () => {
  const plan = routeCommand('check Vercel status and deploy the latest build');
  assert.equal(plan.requiresApproval, true);
});

test('unknown action against a write-capable provider defaults to approval', () => {
  const plan = routeCommand('help me with GitHub');
  assert.equal(plan.requiresApproval, true);
});
