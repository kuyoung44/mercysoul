import crypto from 'node:crypto';

/**
 * MercySoul Vision Brain agent registry.
 *
 * This registry describes agent roles and capability boundaries. It does not
 * grant credentials or execute integrations. Every external mutation remains
 * disabled until a matching, explicit human approval is supplied.
 */

const AGENTS = Object.freeze([
  {
    id: 'vision',
    name: 'Vision Agent',
    purpose: 'Transform user intent into creative briefs, concepts, and plans.',
    capabilities: ['brief.create', 'art.plan', 'content.draft'],
    deniedCapabilities: ['publish', 'send_message', 'spend_money', 'delete_data'],
  },
  {
    id: 'builder',
    name: 'Builder Agent',
    purpose: 'Plan and prepare websites, software, tests, and deployment changes.',
    capabilities: ['code.inspect', 'code.propose', 'code.test_plan', 'deployment.propose'],
    deniedCapabilities: ['production_deploy', 'delete_project', 'change_billing'],
  },
  {
    id: 'business',
    name: 'Business Agent',
    purpose: 'Prepare service offers, proposals, client workflows, and revenue analysis.',
    capabilities: ['business.analyze', 'proposal.draft', 'lead.organize'],
    deniedCapabilities: ['charge_customer', 'transfer_funds', 'send_contract'],
  },
  {
    id: 'research',
    name: 'Research Agent',
    purpose: 'Collect, compare, and summarize evidence with source provenance.',
    capabilities: ['research.search', 'research.summarize', 'research.compare'],
    deniedCapabilities: ['purchase', 'publish', 'contact_third_party'],
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    purpose: 'Prepare channel-specific campaigns and content for review.',
    capabilities: ['campaign.plan', 'social.draft', 'analytics.review'],
    deniedCapabilities: ['social.publish', 'ad_spend', 'send_bulk_message'],
  },
  {
    id: 'guardian',
    name: 'Guardian Agent',
    purpose: 'Evaluate scope, risk, permissions, approvals, and audit evidence.',
    capabilities: ['policy.evaluate', 'approval.inspect', 'audit.record'],
    deniedCapabilities: ['override_policy', 'self_approve', 'disable_audit'],
  },
]);

const EXTERNAL_MUTATION_PREFIXES = Object.freeze([
  'publish', 'send_', 'charge_', 'transfer_', 'delete_', 'production_',
  'ad_spend', 'change_billing', 'contact_third_party',
]);

export function listAgentDefinitions() {
  return AGENTS.map((agent) => ({
    ...agent,
    capabilities: [...agent.capabilities],
    deniedCapabilities: [...agent.deniedCapabilities],
  }));
}

export function getAgentDefinition(agentId) {
  const agent = AGENTS.find((item) => item.id === String(agentId || '').trim());
  return agent ? {
    ...agent,
    capabilities: [...agent.capabilities],
    deniedCapabilities: [...agent.deniedCapabilities],
  } : null;
}

export function isExternalMutation(capability) {
  const normalized = String(capability || '').trim().toLowerCase();
  return EXTERNAL_MUTATION_PREFIXES.some((prefix) =>
    normalized === prefix || normalized.startsWith(prefix)
  );
}

/**
 * Creates a proposal only. This function never calls a tool or performs an
 * external action. Approval is bound to the exact agent, capability and scope.
 */
export function createDispatchProposal({
  agentId,
  capability,
  scope,
  requestId = crypto.randomUUID(),
} = {}) {
  const agent = getAgentDefinition(agentId);
  const normalizedCapability = String(capability || '').trim();
  const normalizedScope = String(scope || '').trim();

  if (!agent) {
    return { ok: false, status: 'denied', reason: 'unknown_agent' };
  }
  if (!normalizedCapability || !normalizedScope) {
    return { ok: false, status: 'denied', reason: 'capability_and_scope_required' };
  }
  if (agent.deniedCapabilities.includes(normalizedCapability)) {
    return { ok: false, status: 'denied', reason: 'capability_explicitly_denied' };
  }
  if (!agent.capabilities.includes(normalizedCapability)) {
    return { ok: false, status: 'denied', reason: 'capability_not_registered' };
  }

  const externalMutation = isExternalMutation(normalizedCapability);
  return {
    ok: true,
    status: 'proposed',
    proposal: {
      proposalId: crypto.randomUUID(),
      requestId: String(requestId),
      agentId: agent.id,
      capability: normalizedCapability,
      scope: normalizedScope,
      externalMutation,
      approvalRequired: externalMutation,
      executionAllowed: false,
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Verifies a separate human approval against the complete proposal tuple.
 * A positive approval does not itself execute anything; the caller must still
 * pass the approved proposal through the platform's governance executor.
 */
export function verifyDispatchApproval(proposal, approval) {
  if (!proposal || proposal.status === 'denied' || !proposal.proposalId) {
    return { authorized: false, reason: 'valid_proposal_required' };
  }
  if (!proposal.externalMutation) {
    return { authorized: true, reason: 'non_external_capability', executionAllowed: false };
  }
  if (!approval || approval.approved !== true) {
    return { authorized: false, reason: 'explicit_approval_required' };
  }
  const exactMatch =
    approval.proposalId === proposal.proposalId &&
    approval.requestId === proposal.requestId &&
    approval.agentId === proposal.agentId &&
    approval.capability === proposal.capability &&
    approval.scope === proposal.scope &&
    typeof approval.approvedBy === 'string' &&
    approval.approvedBy.trim().length > 0;
  if (!exactMatch) {
    return { authorized: false, reason: 'approval_scope_mismatch' };
  }
  return {
    authorized: true,
    reason: 'approval_verified_executor_gate_still_required',
    executionAllowed: false,
  };
}

export const agentRegistryStatus = () => ({
  enabled: true,
  agents: AGENTS.length,
  agentIds: AGENTS.map(({ id }) => id),
  mode: 'proposal_only',
  externalMutationDefault: false,
  humanApprovalRequiredForExternalMutation: true,
  executionPerformed: false,
});
