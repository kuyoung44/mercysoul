import test from 'node:test';
import assert from 'node:assert/strict';
import { approvalMatchesPlan, createHostProvisionPlan, validateHostProvisionRequest } from './host-provisioning.js';

const validRequest = {
  project: 'mercysoul-demo-site',
  repository: 'kuyoung44/mercysoul',
  branch: 'main',
  provider: 'vercel',
  mode: 'plan'
};

test('validates one explicitly scoped Vercel host request', () => {
  const result = validateHostProvisionRequest(validRequest);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('rejects unsupported providers and execution mode', () => {
  assert.equal(validateHostProvisionRequest({ ...validRequest, provider: 'other' }).valid, false);
  assert.equal(validateHostProvisionRequest({ ...validRequest, mode: 'execute' }).valid, false);
});

test('rejects unsafe project, repository and branch identifiers', () => {
  assert.equal(validateHostProvisionRequest({ ...validRequest, project: '../prod' }).valid, false);
  assert.equal(validateHostProvisionRequest({ ...validRequest, repository: 'owner/../repo' }).valid, false);
  assert.equal(validateHostProvisionRequest({ ...validRequest, branch: '../../main' }).valid, false);
});

test('plan is deterministic and explicitly non-mutating', () => {
  const first = createHostProvisionPlan(validRequest, { checksComplete: true, githubRepositoryAccessible: true, githubBranchExists: true, vercelReadAccessVerified: true });
  const second = createHostProvisionPlan(validRequest, { checksComplete: true, githubRepositoryAccessible: true, githubBranchExists: true, vercelReadAccessVerified: true });
  assert.equal(first.ok, true);
  assert.equal(first.planDigest, second.planDigest);
  assert.equal(first.plan.externalMutation, false);
  assert.equal(first.plan.gates.executionEnabled, false);
});

test('plan digest changes when the target changes', () => {
  const first = createHostProvisionPlan(validRequest);
  const second = createHostProvisionPlan({ ...validRequest, project: 'mercysoul-demo-site-2' });
  assert.notEqual(first.planDigest, second.planDigest);
});

test('approval must match the exact digest and include a human approval record', () => {
  assert.equal(approvalMatchesPlan({ planDigest: 'abc', approvedByHuman: true, approvalId: 'approval-1' }, 'abc'), true);
  assert.equal(approvalMatchesPlan({ planDigest: 'other', approvedByHuman: true, approvalId: 'approval-1' }, 'abc'), false);
  assert.equal(approvalMatchesPlan({ planDigest: 'abc', approvedByHuman: false, approvalId: 'approval-1' }, 'abc'), false);
  assert.equal(approvalMatchesPlan({ planDigest: 'abc', approvedByHuman: true }, 'abc'), false);
});
