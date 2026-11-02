const AGENT_IDS = new Set([
  'vision', 'builder', 'business', 'research', 'marketing', 'guardian',
]);

/**
 * Fail-closed authorization for memories retrieved by a specialist agent.
 * The authenticated owner is the security boundary; agent allowlists add a
 * second boundary inside that owner's workspace.
 */
export function canAgentReadMemory(memory, context = {}) {
  if (!memory || typeof memory !== 'object') return false;

  const ownerId = String(context.ownerId || '');
  const agentId = String(context.agentId || '').toLowerCase();
  if (!ownerId || !agentId || !AGENT_IDS.has(agentId)) return false;
  if (String(memory.owner_id || memory.ownerId || '') !== ownerId) return false;
  if (memory.consent_status !== 'approved' && memory.consented !== true) return false;

  const memoryProject = memory.project_id ?? memory.projectId ?? null;
  const requestedProject = context.projectId ?? null;
  if (memoryProject !== null && memoryProject !== requestedProject) return false;

  const allowed = Array.isArray(memory.allowed_agents)
    ? memory.allowed_agents
    : Array.isArray(memory.allowedAgents) ? memory.allowedAgents : [];
  if (!allowed.includes(agentId)) return false;

  return memory.visibility === 'shared' || memory.visibility === 'private';
}

export function filterMemoriesForAgent(memories = [], context = {}) {
  if (!Array.isArray(memories)) return [];
  return memories.filter((memory) => canAgentReadMemory(memory, context));
}

export function memoryAccessPolicyStatus() {
  return {
    agents: [...AGENT_IDS],
    ownerScoped: true,
    projectScoped: true,
    explicitConsentRequired: true,
    privateMemoryRequiresAgentAllowlist: true,
    defaultDecision: 'deny',
    externalMutation: false,
  };
}
