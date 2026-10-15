import test from "node:test";
import assert from "node:assert/strict";
import {
  createToolBuildMission, recordToolRequirement, approveToolAction,
  runContinuousToolBuild, assessToolBuildMission
} from "./continuous-tool-builder.js";

function mission(overrides = {}) {
  return createToolBuildMission({
    missionId: "ctb-test-1", project: { id: "demo-app", name: "Demo App" },
    goal: "Build the tools needed to validate a demo app",
    workspace: { id: "authorized-workspace", kind: "repository" },
    scope: ["source files", "unit tests"],
    authorization: { explicit: true, actor: "founder", basis: "authorized project work",
      projectId: "demo-app", workspaceId: "authorized-workspace" },
    ...overrides
  });
}
const adapters = {
  analyze: async () => ({ ok: true, summary: "One missing test tool", requirements: [
    { id: "test-runner", capability: "test-runner", reason: "Run focused project tests",
      acceptanceCriteria: ["Returns pass/fail", "Captures evidence"], risk: "low" }
  ] }),
  build: async ({ tool }) => ({ ok: true, artifact: { path: "generated/test-runner.js", toolId: tool.id } }),
  test: async ({ tool }) => ({ ok: true, evidence: { test: tool.id, passed: true } }),
  verify: async ({ tools }) => ({ ok: tools.every(t => t.status === "tested"), evidence: "independent-check-1" })
};

test("authorization is bound to the exact project and workspace", () => {
  const m = mission({ authorization: { explicit: true, actor: "founder", basis: "yes", projectId: "other", workspaceId: "authorized-workspace" } });
  assert.equal(m.authorization.authorized, false);
  assert.throws(() => recordToolRequirement(m, { id: "x", capability: "x", reason: "x" }), /authorization/);
});

test("build pauses until each generated tool has workspace-bound approval", async () => {
  const m = mission();
  const result = await runContinuousToolBuild(m, adapters);
  assert.equal(result.status, "awaiting_approval");
  assert.equal(result.blockers[0].action, "build");
  assert.equal(result.externalMutation, false);
});

test("approved bounded build proceeds through tests and independent verification", async () => {
  const m = mission();
  recordToolRequirement(m, { id: "test-runner", capability: "test-runner", reason: "Run tests", risk: "low" });
  approveToolAction(m, { actor: "founder", action: "build", toolId: "test-runner", scope: "authorized-workspace", explicit: true });
  const result = await runContinuousToolBuild(m, adapters);
  assert.equal(result.status, "completed");
  assert.equal(result.phase, "RECORDED");
  assert.equal(result.tools[0].status, "tested");
  assert.equal(result.externalMutation, false);
  assert.equal(assessToolBuildMission(result).toolsVerified, 1);
});

test("generic approval cannot authorize deployment, purchase, or external mutation", () => {
  const m = mission();
  assert.throws(() => approveToolAction(m, { actor: "founder", action: "deploy", explicit: true }), /cannot authorize deployment/);
  assert.throws(() => approveToolAction(m, { actor: "founder", action: "build", toolId: "x", scope: "other-workspace", explicit: true }), /bounded/);
});

test("independent verification failure pauses and records a blocker", async () => {
  const m = mission();
  recordToolRequirement(m, { id: "test-runner", capability: "test-runner", reason: "Run tests", risk: "low" });
  approveToolAction(m, { actor: "founder", action: "build", toolId: "test-runner", scope: "authorized-workspace", explicit: true });
  const result = await runContinuousToolBuild(m, { ...adapters, verify: async () => ({ ok: false, reason: "Evidence incomplete" }) });
  assert.equal(result.status, "paused_verification_failed");
  assert.equal(result.blockers[0].type, "independent_verification_failed");
});

test("continuous mode is bounded by configured cycle and tool limits", () => {
  const m = mission({ limits: { maxCycles: 999, maxTools: 999, maxRepairAttempts: 99 } });
  assert.equal(m.limits.maxCycles, 10);
  assert.equal(m.limits.maxTools, 30);
  assert.equal(m.limits.maxRepairAttempts, 3);
});

test("paused approval can resume after the scoped approval is recorded", async () => {
  const first = await runContinuousToolBuild(mission(), adapters);
  assert.equal(first.status, "awaiting_approval");
  approveToolAction(first, { actor: "founder", action: "build", toolId: "test-runner", scope: "authorized-workspace", explicit: true });
  const resumed = await runContinuousToolBuild(first, adapters);
  assert.equal(resumed.status, "completed");
});

test("failed build is retried only within the configured cycle budget", async () => {
  const m = mission({ limits: { maxCycles: 2 } });
  recordToolRequirement(m, { id: "test-runner", capability: "test-runner", reason: "Run tests", risk: "low" });
  approveToolAction(m, { actor: "founder", action: "build", toolId: "test-runner", scope: "authorized-workspace", explicit: true });
  let attempts = 0;
  const result = await runContinuousToolBuild(m, {
    ...adapters,
    build: async () => (++attempts === 1 ? { ok: false, error: "temporary compiler error" } : { ok: true, artifact: "test-runner.js" })
  });
  assert.equal(attempts, 2);
  assert.equal(result.status, "completed");
  assert.equal(result.cycle, 2);
});
