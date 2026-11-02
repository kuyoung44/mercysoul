import test from 'node:test';
import assert from 'node:assert/strict';
import { canAgentReadMemory, filterMemoriesForAgent } from './memory-access.js';

const shared = {
  owner_id: 'owner-1',
  project_id: null,
  consent_status: 'approved',
  visibility: 'shared',
  allowed_agents: ['vision', 'builder', 'business', 'research', 'marketing', 'guardian'],
};

test('shared approved memory is visible to an allowlisted specialist', () => {
  assert.equal(canAgentReadMemory(shared, { ownerId: 'owner-1', agentId: 'builder' }), true);
});

test('memory is never visible across owners', () => {
  assert.equal(canAgentReadMemory(shared, { ownerId: 'owner-2', agentId: 'builder' }), false);
});

test('private memory is limited to explicitly allowed agents', () => {
  const privateMemory = { ...shared, visibility: 'private', allowed_agents: ['guardian'] };
  assert.equal(canAgentReadMemory(privateMemory, { ownerId: 'owner-1', agentId: 'guardian' }), true);
  assert.equal(canAgentReadMemory(privateMemory, { ownerId: 'owner-1', agentId: 'marketing' }), false);
});

test('project memory does not leak into another project', () => {
  const projectMemory = { ...shared, project_id: 'project-a' };
  assert.equal(canAgentReadMemory(projectMemory, { ownerId: 'owner-1', agentId: 'vision', projectId: 'project-b' }), false);
  assert.equal(canAgentReadMemory(projectMemory, { ownerId: 'owner-1', agentId: 'vision', projectId: 'project-a' }), true);
});

test('missing consent, unknown agent, or missing context fails closed', () => {
  assert.equal(canAgentReadMemory({ ...shared, consent_status: 'pending' }, { ownerId: 'owner-1', agentId: 'vision' }), false);
  assert.equal(canAgentReadMemory(shared, { ownerId: 'owner-1', agentId: 'root' }), false);
  assert.equal(canAgentReadMemory(shared, {}), false);
});

test('filter returns only records authorized for this owner and agent', () => {
  const privateMemory = { ...shared, id: 'private', visibility: 'private', allowed_agents: ['guardian'] };
  const otherOwner = { ...shared, id: 'other-owner', owner_id: 'owner-2' };
  const allowed = filterMemoriesForAgent([shared, privateMemory, otherOwner], { ownerId: 'owner-1', agentId: 'builder' });
  assert.deepEqual(allowed, [shared]);
});
