/**
 * MercySoul Sovereign Mission Coordinator
 * OG BE 44MS16 — Free-first creation and guarded parallel missions.
 * This module is a policy/core primitive; it does not launch external agents by itself.
 */

export const MISSION_STATES = Object.freeze([
  "QUEUED", "PLANNING", "BUILDING", "TESTING", "BLOCKED",
  "READY_FOR_APPROVAL", "DEPLOYED", "VERIFIED", "FAILED"
]);

const transitions = {
  QUEUED: ["PLANNING", "BLOCKED", "FAILED"],
  PLANNING: ["BUILDING", "BLOCKED", "FAILED"],
  BUILDING: ["TESTING", "BLOCKED", "FAILED"],
  TESTING: ["READY_FOR_APPROVAL", "BUILDING", "BLOCKED", "FAILED"],
  BLOCKED: ["QUEUED", "PLANNING", "FAILED"],
  READY_FOR_APPROVAL: ["DEPLOYED", "BUILDING", "BLOCKED", "FAILED"],
  DEPLOYED: ["VERIFIED", "BLOCKED", "FAILED"],
  VERIFIED: [],
  FAILED: ["QUEUED"]
};

export function createMission({ id, goal, owner = "founder", tasks = [] } = {}) {
  if (typeof id !== "string" || !id.trim()) throw new TypeError("Mission id is required");
  if (typeof goal !== "string" || !goal.trim()) throw new TypeError("Mission goal is required");
  return {
    id: id.trim(),
    goal: goal.trim(),
    owner,
    tasks: tasks.map((task, index) => ({
      id: task.id ?? `${id}-task-${index + 1}`,
      title: task.title,
      agent: task.agent ?? "builder",
      status: "QUEUED"
    })),
    status: "QUEUED",
    approvals: [],
    audit: [{ event: "MISSION_CREATED", actor: owner, at: new Date().toISOString() }]
  };
}

export function transitionMission(mission, nextState, { actor = "system", evidence } = {}) {
  if (!mission || !MISSION_STATES.includes(mission.status)) throw new TypeError("Invalid mission");
  if (!MISSION_STATES.includes(nextState)) throw new TypeError(`Unknown mission state: ${nextState}`);
  if (!transitions[mission.status].includes(nextState)) {
    throw new Error(`Invalid mission transition: ${mission.status} -> ${nextState}`);
  }
  if (nextState === "VERIFIED" && (!evidence || evidence.passed !== true)) {
    throw new Error("Verification requires passing evidence");
  }
  if (nextState === "DEPLOYED" && !mission.approvals.some(a => a.scope === "deploy")) {
    throw new Error("Deployment requires explicit deploy approval");
  }
  return {
    ...mission,
    status: nextState,
    audit: [...mission.audit, {
      event: "MISSION_STATE_CHANGED",
      from: mission.status,
      to: nextState,
      actor,
      evidence: evidence ?? null,
      at: new Date().toISOString()
    }]
  };
}

export function approveMission(mission, { actor, scope, explicit = false } = {}) {
  if (!mission || typeof actor !== "string" || !actor.trim()) throw new TypeError("Approver identity is required");
  if (explicit !== true) throw new Error("Explicit human approval is required");
  if (!["deploy", "paid_resource", "external_mutation"].includes(scope)) {
    throw new Error("Approval scope is not recognized");
  }
  return {
    ...mission,
    approvals: [...mission.approvals, { actor: actor.trim(), scope, at: new Date().toISOString() }],
    audit: [...mission.audit, {
      event: "APPROVAL_RECORDED", actor: actor.trim(), scope, at: new Date().toISOString()
    }]
  };
}

/**
 * Candidates may declare tier: local, free, paid; supported: boolean;
 * estimatedCost: number. Free/local resources rank ahead of paid resources.
 * A paid candidate is never selected without explicit paid_resource approval.
 */
export function selectCreationResource(candidates = [], { paidResourceApproved = false } = {}) {
  const eligible = candidates.filter(candidate =>
    candidate && candidate.supported === true &&
    ["local", "free", "paid"].includes(candidate.tier) &&
    (candidate.tier !== "paid" || paidResourceApproved === true)
  );
  const rank = { local: 0, free: 1, paid: 2 };
  eligible.sort((a, b) =>
    rank[a.tier] - rank[b.tier] ||
    (Number(a.estimatedCost ?? 0) - Number(b.estimatedCost ?? 0))
  );
  return eligible[0] ?? null;
}

export function buildMissionPlan(goal) {
  if (typeof goal !== "string" || !goal.trim()) throw new TypeError("A creation goal is required");
  return [
    { agent: "vision", task: "Clarify goal and acceptance criteria" },
    { agent: "architect", task: "Propose design and independent workstreams" },
    { agent: "builder", task: "Implement approved scope" },
    { agent: "tester", task: "Run available tests and report evidence" },
    { agent: "guardian", task: "Check permissions, risks, and cost policy" },
    { agent: "verifier", task: "Verify outcomes before declaring completion" }
  ].map((item, index) => ({ id: `task-${index + 1}`, ...item, status: "QUEUED" }));
}
