/**
 * MercySoul Vision Brain — One-Prompt AI Agent Builder.
 *
 * Turns one natural-language prompt into a bounded agent specification, then
 * delegates generation, tests, and independent verification to injected adapters.
 * This module does not call an LLM, execute generated code, access the network,
 * write project files, install packages, or deploy on its own.
 */
const text = (value, label) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  return value.trim();
};
const copy = value => structuredClone(value);
const ok = value => value && value.ok === true;

export function createPromptAgentMission({
  missionId, prompt, project, workspace, authorization = {}, scope = []
}) {
  const id = text(missionId, "missionId");
  const projectId = text(project?.id, "project.id");
  const workspaceId = text(workspace?.id, "workspace.id");
  const explicit = authorization.explicit === true
    && typeof authorization.actor === "string" && authorization.actor.trim()
    && typeof authorization.basis === "string" && authorization.basis.trim()
    && authorization.projectId === projectId
    && authorization.workspaceId === workspaceId;
  return {
    schemaVersion: "1.0.0",
    missionId: id,
    prompt: text(prompt, "prompt"),
    project: { id: projectId, name: project.name ?? projectId },
    workspace: { id: workspaceId, kind: workspace.kind ?? "repository" },
    scope: [...new Set(scope.filter(item => typeof item === "string" && item.trim()).map(item => item.trim()))],
    authorization: { authorized: Boolean(explicit), actor: explicit ? authorization.actor.trim() : null,
      basis: explicit ? authorization.basis.trim() : null, projectId, workspaceId },
    phase: "INTAKE",
    status: explicit ? "ready" : "blocked",
    spec: null,
    artifact: null,
    evidence: { tests: null, verification: null },
    approvals: [],
    blockers: [],
    events: [{ sequence: 1, type: "mission_created", at: new Date().toISOString(),
      detail: { projectId, workspaceId, authorized: Boolean(explicit) } }],
    externalMutation: false
  };
}

function record(mission, type, detail = {}) {
  mission.events.push({ sequence: mission.events.length + 1, type, at: new Date().toISOString(), detail: copy(detail) });
}
function adapter(adapters, name) {
  if (typeof adapters?.[name] !== "function") throw new Error(`missing injected adapter: ${name}`);
}
function requireAuth(mission) {
  if (mission.authorization?.authorized !== true) throw new Error("explicit project-and-workspace authorization is required");
}
function pause(mission, status, type, detail = {}) {
  mission.status = status;
  mission.blockers.push({ type, ...copy(detail) });
  record(mission, "paused", { status, type, ...detail });
  return mission;
}

/** Human approval is explicit, actor-attributed, and bound to this workspace. */
export function approvePromptAgentBuild(mission, { actor, explicit = false, workspaceId } = {}) {
  requireAuth(mission);
  if (explicit !== true || typeof actor !== "string" || !actor.trim())
    throw new Error("explicit human approval and actor are required");
  if (workspaceId !== mission.workspace.id)
    throw new Error("approval must be bound to the authorized workspace");
  mission.approvals.push({ action: "build_agent", actor: actor.trim(), workspaceId, at: new Date().toISOString() });
  record(mission, "human_approval_recorded", { action: "build_agent", workspaceId });
  if (mission.status === "awaiting_approval") mission.status = "ready";
  return mission;
}

/**
 * One prompt → structured specification → approval → generated artifact → tests
 * → independent verification. Adapters must enforce their own sandbox limits.
 */
export async function buildAgentFromOnePrompt(inputMission, adapters) {
  const mission = copy(inputMission);
  try {
    requireAuth(mission);
    for (const name of ["analyzePrompt", "generateAgent", "testAgent", "verifyAgent"]) adapter(adapters, name);
    if (mission.status === "blocked") return pause(mission, "blocked", "authorization_required");
    if (mission.status === "completed") return mission;

    if (!mission.spec) {
      mission.phase = "ANALYZE";
      const analysis = await adapters.analyzePrompt({
        prompt: mission.prompt, project: copy(mission.project),
        workspace: copy(mission.workspace), scope: copy(mission.scope)
      });
      if (!ok(analysis) || !analysis.spec || typeof analysis.spec !== "object")
        return pause(mission, "paused_analysis_failed", "agent_specification_not_validated");
      mission.spec = copy(analysis.spec);
      record(mission, "agent_specification_created", {
        name: mission.spec.name ?? "unnamed-agent",
        capabilities: Array.isArray(mission.spec.capabilities) ? mission.spec.capabilities.length : 0
      });
    }

    if (!mission.approvals.some(item => item.action === "build_agent" && item.workspaceId === mission.workspace.id)) {
      mission.phase = "APPROVAL";
      return pause(mission, "awaiting_approval", "approval_required",
        { action: "build_agent", workspaceId: mission.workspace.id });
    }

    mission.phase = "BUILD";
    const generated = await adapters.generateAgent({
      spec: copy(mission.spec), project: copy(mission.project),
      workspace: copy(mission.workspace), scope: copy(mission.scope)
    });
    if (!ok(generated) || !generated.artifact)
      return pause(mission, "paused_build_failed", "agent_generation_failed",
        { reason: String(generated?.error ?? "No artifact returned").slice(0, 400) });
    mission.artifact = copy(generated.artifact);
    record(mission, "agent_generated", { artifactId: mission.artifact.id ?? null });

    mission.phase = "TEST";
    const tests = await adapters.testAgent({ spec: copy(mission.spec), artifact: copy(mission.artifact) });
    mission.evidence.tests = copy(tests?.evidence ?? null);
    if (!ok(tests))
      return pause(mission, "paused_tests_failed", "agent_tests_failed",
        { reason: String(tests?.reason ?? "Tests did not pass").slice(0, 400) });
    record(mission, "agent_tests_passed");

    mission.phase = "INDEPENDENT_VERIFY";
    const verification = await adapters.verifyAgent({
      spec: copy(mission.spec), artifact: copy(mission.artifact),
      testEvidence: copy(mission.evidence.tests), policy: {
        noUnapprovedExternalMutation: true, humanJudgmentRequired: true
      }
    });
    mission.evidence.verification = copy(verification?.evidence ?? null);
    if (!ok(verification))
      return pause(mission, "paused_verification_failed", "independent_verification_failed",
        { reason: String(verification?.reason ?? "No independent verification evidence").slice(0, 400) });

    mission.phase = "RECORDED";
    mission.status = "completed";
    record(mission, "agent_verified", { externalMutation: false });
    record(mission, "mission_completed", { requiresHumanReviewBeforeIntegration: true });
    return mission;
  } catch (error) {
    return pause(mission, "paused_error", "execution_error",
      { reason: String(error?.message ?? error).slice(0, 400) });
  }
}

export function assessPromptAgentMission(mission) {
  return {
    missionId: mission.missionId, status: mission.status, phase: mission.phase,
    specificationReady: Boolean(mission.spec), artifactReady: Boolean(mission.artifact),
    testsPassed: mission.evidence?.tests !== null && mission.evidence?.tests !== undefined,
    independentlyVerified: mission.evidence?.verification !== null && mission.evidence?.verification !== undefined,
    blockers: copy(mission.blockers), externalMutation: false,
    authorizationValid: mission.authorization?.authorized === true,
    requiresHumanJudgment: true,
    integrationAuthorized: false,
    deploymentAuthorized: false
  };
}
