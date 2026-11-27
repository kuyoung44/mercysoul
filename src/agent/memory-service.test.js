import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryServiceStatus } from './memory-service.js';
import { canAgentReadMemory, filterMemoriesForAgent } from './memory-access.js';

test('memory service status never exposes credentials', () => {
  const status = memoryServiceStatus();
  assert.equal(status.table, 'ms_agent_memories');
  assert.equal(status.ownerScoped, true);
  assert.equal(status.consentRequired, true);
  assert.equal(JSON.stringify(status).includes('SERVICE_ROLE_KEY'), false);
});

test('six specialist agents are registered for memory access', () => {
  assert.deepEqual(memoryServiceStatus().agents, ['vision', 'builder', 'business', 'research', 'marketing', 'guardian']);
});

test('only approved, owner-scoped, project-matched and agent-allowed memories pass', () => {
  const base = {
    owner_id: 'owner-a', project_id: 'site-a', consent_status: 'approved',
    visibility: 'shared', allowed_agents: ['vision', 'builder'],
  };
  assert.equal(canAgentReadMemory(base, { ownerId: 'owner-a', agentId: 'vision', projectId: 'site-a' }), true);
  assert.equal(canAgentReadMemory(base, { ownerId: 'owner-b', agentId: 'vision', projectId: 'site-a' }), false);
  assert.equal(canAgentReadMemory(base, { ownerId: 'owner-a', agentId: 'marketing', projectId: 'site-a' }), false);
  assert.equal(canAgentReadMemory(base, { ownerId: 'owner-a', agentId: 'vision', projectId: 'site-b' }), false);
});

test('memory retrieval filters unsafe rows fail-closed', () => {
  const rows = [
    { id: '1', owner_id: 'owner-a', consent_status: 'approved', visibility: 'shared', allowed_agents: ['vision'] },
    { id: '2', owner_id: 'owner-a', consent_status: 'pending', visibility: 'shared', allowed_agents: ['vision'] },
  ];
  assert.deepEqual(filterMemoriesForAgent(rows, { ownerId: 'owner-a', agentId: 'vision' }).map((row) => row.id), ['1']);
});
