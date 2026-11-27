import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listAgentDefinitions,
  getAgentDefinition,
  createDispatchProposal,
  verifyDispatchApproval,
  agentRegistryStatus,
} from './agent-registry.js';

test('registry exposes six named specialist agents', () => {
  assert.equal(listAgentDefinitions().length, 6);
  assert.ok(getAgentDefinition('guardian'));
  assert.equal(getAgentDefinition('not-real'), null);
});

test('unregistered capability is denied', () => {
  const result = createDispatchProposal({
    agentId: 'marketing',
    capability: 'social.publish',
    scope: 'instagram:brand-account',
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'capability_explicitly_denied');
});

test('registered safe capability creates proposal without execution', () => {
  const result = createDispatchProposal({
    agentId: 'marketing',
    capability: 'social.draft',
    scope: 'instagram:campaign-brief',
  });
  assert.equal(result.ok, true);
  assert.equal(result.proposal.executionAllowed, false);
  assert.equal(result.proposal.externalMutation, false);
});

test('external mutation remains blocked without exact scoped approval', () => {
  const result = createDispatchProposal({
    agentId: 'builder',
    capability: 'deployment.propose',
    scope: 'project:mercysoul:production',
  });
  assert.equal(result.ok, true);
  assert.equal(result.proposal.externalMutation, false);
  assert.equal(verifyDispatchApproval(result.proposal, null).executionAllowed, false);
});

test('status explicitly reports proposal-only mode', () => {
  const status = agentRegistryStatus();
  assert.equal(status.mode, 'proposal_only');
  assert.equal(status.externalMutationDefault, false);
  assert.equal(status.executionPerformed, false);
});
