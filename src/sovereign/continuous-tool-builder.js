/**
 * MercySoul Vision Brain — Continuous Tool Builder.
 *
 * Pure orchestration contract. All project access, code generation, test execution,
 * and integration are injected adapters; this module never runs shell commands,
 * writes files, opens networks, installs packages, or deploys by itself.
 */
const PHASES = [
  "INTAKE", "ANALYZE", "CAPABILITY_GAP", "TOOL_PLAN", "BUILD",
  "TEST", "INDEPENDENT_VERIFY", "INTEGRATE", "REVIEW", "RECORDED"
];
const ACTIONS = new Set(["build", "test", "integrate", "deploy", "purchase", "external_mutation"]);

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  return value.trim();
}
function clone(value) { return structuredClone(value); }

export function createToolBuildMission({
  missionId, project, goal, workspace, scope = [], authorization = {},
  limits = {}
}) {
  const id = requireText(missionId, "missionId");
  const projectId = requireText(project?.id, "project.id");
  const workspaceId = requireText(workspace?.id, "workspace.id");
  const explicit = authorization.explicit === true
    && typeof authorization.actor === "string" && authorization.actor.trim()
    && typeof authorization.basis === "string" && authorization.basis.trim()
    && authorization.workspaceId === workspaceId
    && authorization.projectId === projectId;
  const safeLimits = {
    maxCycles: Math.min(10, Math.max(1, Number.isInteger(limits.maxCycles) ? limits.maxCycles : 3)),
    maxTools: Math.min(30, Math.max(1, Number.isInteger(limits.maxTools) ? limits.maxTools : 8)),
    maxRepairAttempts: Math.min(3, Math.max(0, Number.isInteger(limits.maxRepairAttempts) ? limits.maxRepairAttempts : 2))
  };
  return {
    schemaVersion: "1.0.0", missionId: id, project: { id: projectId, name: project.name ?? projectId },
    goal: requireText(goal, "goal"), workspace: { id: workspaceId, kind: workspace.kind ?? "repository" },
    scope: [...new Set(scope.filter(x => typeof x === "string" && x.trim()).map(x => x.trim()))],
    authorization: { authorized: Boolean(explicit), actor: explicit ? authorization.actor : null,
      basis: explicit ? authorization.basis : null, projectId, workspaceId },
    limits: safeLimits, phase: "INTAKE", cycle: 0, tools: [], events: [],
    approvals: [], blockers: [], status: explicit ? "ready" : "blocked",
    externalMutation: false, createdAt: new Date().toISOString()
  };
}

function event(mission, type, detail = {}) {
  mission.events.push({ sequence: mission.events.length + 1, type, at: new Date().toISOString(), detail: clone(detail) });
}
function requireAuthorized(mission) {
  if (!mission.authorization?.authorized) throw new Error("explicit authorization bound to this project and workspace is required");
}
function transition(mission, phase) {
  const current = PHASES.indexOf(mission.phase), next = PHASES.indexOf(phase);
  if (next !== current + 1) throw new Error("phases must advance one gate at a time");
  mission.phase = phase;
  event(mission, "phase", { phase });
  return mission;
}

export function recordToolRequirement(mission, requirement) {
  requireAuthorized(mission);
  if (!["INTAKE", "ANALYZE", "CAPABILITY_GAP", "TOOL_PLAN"].includes(mission.phase))
    throw new Error("requirements are locked after tool planning");
  const item = {
    id: requireText(requirement?.id, "requirement.id"),
    capability: requireText(requirement?.capability, "requirement.capability"),
    reason: requireText(requirement?.reason, "requirement.reason"),
    acceptanceCriteria: Array.isArray(requirement?.acceptanceCriteria) ? requirement.acceptanceCriteria.filter(x => typeof x === "string") : [],
    reuseCapabilityId: requirement?.reuseCapabilityId ?? null,
    risk: ["low", "medium", "high"].includes(requirement?.risk) ? requirement.risk : "medium",
    status: "planned"
  };
  if (mission.tools.some(t => t.id === item.id)) throw new Error("tool requirement id must be unique");
  if (mission.tools.length >= mission.limits.maxTools) throw new Error("tool limit reached");
  mission.tools.push(item);
  event(mission, "tool_requirement_recorded", { id: item.id, capability: item.capability, risk: item.risk });
  return mission;
}

export function approveToolAction(mission, { actor, action, toolId = null, explicit = false, scope = null } = {}) {
  requireAuthorized(mission);
  if (explicit !== true || typeof actor !== "string" || !actor.trim())
    throw new Error("explicit human approval and actor are required");
  if (!ACTIONS.has(action)) throw new Error("unknown consequential action");
  if (["deploy", "purchase", "external_mutation"].includes(action))
    throw new Error("this engine cannot authorize deployment, purchases, or external mutations through a generic approval");
  if (action === "build" && scope !== mission.workspace.id)
    throw new Error("build approval must be bounded to the authorized workspace");
  if (toolId && !mission.tools.some(t => t.id === toolId)) throw new Error("unknown tool requirement");
  const approval = { actor: actor.trim(), action, toolId, scope, at: new Date().toISOString() };
  mission.approvals.push(approval);
  event(mission, "human_approval_recorded", { action, toolId, scope });
  return mission;
}

function hasApproval(mission, action, toolId) {
  return mission.approvals.some(a => a.action === action && (!toolId || a.toolId === toolId)
    && (action !== "build" || a.scope === mission.workspace.id));
}
function assertAdapter(adapters, name) {
  if (typeof adapters?.[name] !== "function") throw new Error(`missing injected adapter: ${name}`);
}
function resultOk(result) { return result && result.ok === true; }

/**
 * Runs bounded continuous cycles using caller-supplied adapters.
 * Required adapters: analyze, build, test, verify. Optional: integrate.
 * Adapter results are untrusted until independently verified. A failed gate pauses.
 */
export async function runContinuousToolBuild(inputMission, adapters) {
  const mission = clone(inputMission);
  requireAuthorized(mission);
  for (const name of ["analyze", "build", "test", "verify"]) assertAdapter(adapters, name);
  if (mission.status === "blocked") throw new Error("mission is blocked");
  if (mission.phase === "RECORDED") return mission;

  try {
    while (mission.cycle < mission.limits.maxCycles) {
      mission.cycle += 1;
      event(mission, "cycle_started", { cycle: mission.cycle });
      if (mission.phase === "INTAKE") transition(mission, "ANALYZE");
      const analysis = await adapters.analyze({ project: clone(mission.project), goal: mission.goal,
        workspace: clone(mission.workspace), scope: clone(mission.scope), cycle: mission.cycle });
      if (!resultOk(analysis)) throw new Error("project analysis failed; paused for review");
      event(mission, "analysis_completed", { summary: analysis.summary ?? "Analysis returned" });

      if (mission.phase === "ANALYZE") transition(mission, "CAPABILITY_GAP");
      const planned = Array.isArray(analysis.requirements) ? analysis.requirements : [];
      for (const requirement of planned) {
        if (!mission.tools.some(t => t.id === requirement.id)) recordToolRequirement(mission, requirement);
      }
      if (mission.phase === "CAPABILITY_GAP") transition(mission, "TOOL_PLAN");
      if (mission.tools.length === 0) {
        event(mission, "no_new_tools_needed");
        transition(mission, "BUILD");
      } else {
        transition(mission, "BUILD");
        for (const tool of mission.tools.filter(t => t.status === "planned" || t.status === "repair_needed")) {
          if (!hasApproval(mission, "build", tool.id)) {
            mission.status = "awaiting_approval";
            mission.blockers.push({ type: "approval_required", action: "build", toolId: tool.id, workspaceId: mission.workspace.id });
            event(mission, "paused_for_approval", { toolId: tool.id });
            return mission;
          }
          const built = await adapters.build({ project: clone(mission.project), workspace: clone(mission.workspace),
            tool: clone(tool), cycle: mission.cycle });
          if (!resultOk(built)) {
            tool.status = "repair_needed";
            tool.lastError = String(built?.error ?? "build failed").slice(0, 500);
            event(mission, "build_failed", { toolId: tool.id });
            continue;
          }
          tool.artifact = built.artifact ?? null;
          tool.status = "built";
          event(mission, "tool_built", { toolId: tool.id, artifact: tool.artifact });
        }
      }
      transition(mission, "TEST");
      for (const tool of mission.tools.filter(t => t.status === "built" || t.status === "tested")) {
        const tested = await adapters.test({ tool: clone(tool), project: clone(mission.project) });
        tool.testEvidence = tested?.evidence ?? null;
        tool.status = resultOk(tested) ? "tested" : "repair_needed";
        event(mission, resultOk(tested) ? "tool_test_passed" : "tool_test_failed", { toolId: tool.id });
      }
      transition(mission, "INDEPENDENT_VERIFY");
      const verification = await adapters.verify({ mission: clone(mission), tools: clone(mission.tools) });
      if (!resultOk(verification)) {
        mission.status = "paused_verification_failed";
        mission.blockers.push({ type: "independent_verification_failed", detail: String(verification?.reason ?? "No passing verification evidence").slice(0, 500) });
        event(mission, "verification_failed");
        return mission;
      }
      event(mission, "independent_verification_passed", { evidence: verification.evidence ?? null });
      const failed = mission.tools.filter(t => t.status === "repair_needed");
      if (failed.length) {
        if (mission.cycle >= mission.limits.maxCycles) {
          mission.status = "paused_cycle_limit";
          mission.blockers.push({ type: "cycle_limit", unresolvedTools: failed.map(t => t.id) });
          event(mission, "cycle_limit_reached");
          return mission;
        }
        mission.phase = "ANALYZE";
        event(mission, "repair_cycle_scheduled", { unresolvedTools: failed.map(t => t.id) });
        continue;
      }
      if (typeof adapters.integrate === "function") {
        if (!hasApproval(mission, "integrate", null)) {
          mission.status = "awaiting_approval";
          mission.blockers.push({ type: "approval_required", action: "integrate", workspaceId: mission.workspace.id });
          event(mission, "paused_for_approval", { action: "integrate" });
          return mission;
        }
        const integrated = await adapters.integrate({ mission: clone(mission), tools: clone(mission.tools) });
        if (!resultOk(integrated)) {
          mission.status = "paused_integration_failed";
          mission.blockers.push({ type: "integration_failed" });
          event(mission, "integration_failed");
          return mission;
        }
        event(mission, "integration_completed", { evidence: integrated.evidence ?? null });
      }
      transition(mission, "INTEGRATE");
      transition(mission, "REVIEW");
      mission.status = "completed";
      transition(mission, "RECORDED");
      event(mission, "mission_completed", { toolCount: mission.tools.length, externalMutation: false });
      return mission;
    }
    mission.status = "paused_cycle_limit";
    mission.blockers.push({ type: "cycle_limit" });
    return mission;
  } catch (error) {
    mission.status = "paused_error";
    mission.blockers.push({ type: "execution_error", message: String(error?.message ?? error).slice(0, 500) });
    event(mission, "execution_paused", { reason: String(error?.message ?? error).slice(0, 500) });
    return mission;
  }
}

export function assessToolBuildMission(mission) {
  return {
    missionId: mission.missionId, status: mission.status, phase: mission.phase,
    cycle: mission.cycle, toolsPlanned: mission.tools.length,
    toolsVerified: mission.tools.filter(t => t.status === "tested").length,
    blockers: clone(mission.blockers), externalMutation: false,
    authorizationValid: mission.authorization?.authorized === true,
    requiresHumanJudgment: mission.status !== "completed"
  };
}
