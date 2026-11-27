import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTION_RISK,
  assessCapabilityReadiness,
  assessProjectComplexity,
  authorizeProjectAction,
  createProjectPlan,
  createProjectRecord,
  orderProjectTasks,
  validateProjectDefinition,
} from './universal-project.js';

test('requires a project goal', () => {
  assert.equal(validateProjectDefinition({}).valid, false);
  assert.throws(() => createProjectRecord({}), /Invalid project definition/);
});

test('assesses complexity from task and domain breadth', () => {
  assert.equal(assessProjectComplexity({ tasks: [], domains: [] }), 'L0');
  assert.equal(assessProjectComplexity({ tasks: [{}, {}, {}], domains: [] }), 'L1');
  assert.equal(assessProjectComplexity({ tasks: Array(8).fill({}), domains: [] }), 'L2');
  assert.equal(assessProjectComplexity({ tasks: [], domains: ['a', 'b', 'c', 'd'] }), 'L3');
  assert.equal(assessProjectComplexity({ critical: true }), 'L4');
});

test('rejects duplicate task ids and unknown dependencies', () => {
  const duplicate = validateProjectDefinition({ goal: 'Build', tasks: [{ id: 'a', title: 'A' }, { id: 'a', title: 'B' }] });
  assert.equal(duplicate.valid, false);
  const missing = validateProjectDefinition({ goal: 'Build', tasks: [{ id: 'a', title: 'A', dependsOn: ['missing'] }] });
  assert.equal(missing.valid, false);
});

test('orders tasks by dependency and detects cycles', () => {
  assert.deepEqual(orderProjectTasks([
    { id: 'ship', dependsOn: ['build'] },
    { id: 'build', dependsOn: ['plan'] },
    { id: 'plan', dependsOn: [] },
  ]), ['plan', 'build', 'ship']);
  assert.throws(() => orderProjectTasks([
    { id: 'a', dependsOn: ['b'] }, { id: 'b', dependsOn: ['a'] },
  ]), /cycle/);
});

test('creates a project record with safe defaults and stable plan order', () => {
  const project = createProjectRecord({
    id: 'project-1',
    goal: 'Build a website',
    domains: ['software'],
    tasks: [{ id: 'build', title: 'Build', dependsOn: ['design'] }, { id: 'design', title: 'Design' }],
  }, { now: '2026-01-01T00:00:00.000Z' });
  assert.equal(project.status, 'planned');
  assert.deepEqual(project.taskOrder, ['design', 'build']);
  const plan = createProjectPlan(project);
  assert.equal(plan.executionEnabled, false);
  assert.equal(plan.requiresHumanApproval, true);
  assert.deepEqual(plan.tasks.map(task => task.id), ['design', 'build']);
  assert.equal(plan.tasks[0].status, 'ready');
  assert.equal(plan.tasks[1].status, 'pending');
});

test('capability registration never implies execution permission', () => {
  for (const state of ['registered', 'connected', 'available', 'executable', 'verified', 'approved']) {
    assert.equal(assessCapabilityReadiness({ id: 'tool-x', state }).canExecute, false);
  }
});

test('read-only actions do not require write approval', () => {
  const result = authorizeProjectAction({
    projectId: 'p1', action: { type: 'read', risk: ACTION_RISK.READ_ONLY }, resource: 'repo',
  });
  assert.equal(result.allowed, true);
  assert.equal(result.approvalRequired, false);
});

test('consequential writes fail closed without approval', () => {
  const result = authorizeProjectAction({
    projectId: 'p1', action: { type: 'deploy', risk: ACTION_RISK.PRODUCTION_CRITICAL }, resource: 'production',
  });
  assert.equal(result.allowed, false);
  assert.equal(result.approvalRequired, true);
});

test('approval must match exact project, action, and resource', () => {
  const approval = {
    status: 'approved', projectId: 'p1', action: 'deploy', resource: 'staging',
    approvedAt: '2026-01-01T00:00:00.000Z', expiresAt: '2027-01-01T00:00:00.000Z',
  };
  const result = authorizeProjectAction({
    projectId: 'p1', action: { type: 'deploy', risk: ACTION_RISK.CONSEQUENTIAL_WRITE },
    resource: 'production', approval, now: '2026-06-01T00:00:00.000Z',
  });
  assert.equal(result.allowed, false);
});

test('expired or revoked approvals are rejected', () => {
  const base = {
    status: 'approved', projectId: 'p1', action: 'write', resource: 'repo',
    approvedAt: '2026-01-01T00:00:00.000Z', expiresAt: '2026-02-01T00:00:00.000Z',
  };
  const input = { projectId: 'p1', action: { type: 'write', risk: ACTION_RISK.REVERSIBLE_WRITE }, resource: 'repo' };
  assert.equal(authorizeProjectAction({ ...input, approval: base, now: '2026-03-01T00:00:00.000Z' }).allowed, false);
  assert.equal(authorizeProjectAction({ ...input, approval: { ...base, revoked: true }, now: '2026-01-15T00:00:00.000Z' }).allowed, false);
});

test('a correctly scoped, active approval authorizes only that one action', () => {
  const result = authorizeProjectAction({
    projectId: 'p1',
    action: { type: 'write-file', risk: ACTION_RISK.REVERSIBLE_WRITE },
    resource: 'workspace/p1',
    approval: {
      status: 'approved', projectId: 'p1', action: 'write-file', resource: 'workspace/p1',
      approvedAt: '2026-01-01T00:00:00.000Z', expiresAt: '2027-01-01T00:00:00.000Z',
    },
    now: '2026-06-01T00:00:00.000Z',
  });
  assert.equal(result.allowed, true);
  assert.equal(result.mode, 'scoped-approved-action');
});

test('prohibited actions are never authorized', () => {
  const result = authorizeProjectAction({
    projectId: 'p1', action: { type: 'prohibited', risk: ACTION_RISK.PROHIBITED },
    resource: 'anything', approval: { status: 'approved' },
  });
  assert.equal(result.allowed, false);
});
