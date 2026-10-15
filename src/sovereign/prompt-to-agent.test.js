import test from "node:test";
import assert from "node:assert/strict";
import { createPromptAgentMission, approvePromptAgentBuild, buildAgentFromOnePrompt, assessPromptAgentMission } from "./prompt-to-agent.js";

const base = () => createPromptAgentMission({
  missionId: "agent-001", prompt: "Build a customer-support agent for my shop.",
  project: { id: "mercysoul", name: "MercySoul" }, workspace: { id: "repo-main" },
  scope: ["src/agents/customer-support"],
  authorization: { explicit: true, actor: "founder", basis: "approved agent prototype",
    projectId: "mercysoul", workspaceId: "repo-main" }
});
const adapters = overrides => ({
  analyzePrompt: async ({ prompt }) => ({ ok: true, spec: {
    name: "customer-support", purpose: prompt, capabilities: ["answer FAQs"],
    tools: [], safety: { humanApprovalForExternalActions: true }
  } }),
  generateAgent: async ({ spec }) => ({ ok: true, artifact: { id: "artifact-1", specName: spec.name } }),
  testAgent: async () => ({ ok: true, evidence: { passed: 5, failed: 0 } }),
  verifyAgent: async () => ({ ok: true, evidence: { policyCheck: "pass", artifactHash: "sha256:test" } }),
  ...overrides
});

test("one prompt becomes a spec but waits for workspace-scoped human approval", async () => {
  const result = await buildAgentFromOnePrompt(base(), adapters());
  assert.equal(result.status, "awaiting_approval");
  assert.equal(result.spec.name, "customer-support");
  assert.equal(result.artifact, null);
});

test("rejects authorization that is not bound to the exact project and workspace", () => {
  const mission = createPromptAgentMission({
    missionId: "x", prompt: "Build an agent", project: { id: "p" }, workspace: { id: "w" },
    authorization: { explicit: true, actor: "founder", basis: "test", projectId: "p", workspaceId: "other" }
  });
  assert.equal(mission.status, "blocked");
});

test("approval cannot be reused for another workspace", () => {
  const mission = base();
  assert.throws(() => approvePromptAgentBuild(mission, { actor: "founder", explicit: true, workspaceId: "other" }), /authorized workspace/);
});

test("approved prompt-to-agent pipeline generates, tests, and independently verifies", async () => {
  const mission = base();
  const pending = await buildAgentFromOnePrompt(mission, adapters());
  approvePromptAgentBuild(pending, { actor: "founder", explicit: true, workspaceId: "repo-main" });
  const result = await buildAgentFromOnePrompt(pending, adapters());
  assert.equal(result.status, "completed");
  assert.equal(result.artifact.id, "artifact-1");
  assert.equal(result.phase, "RECORDED");
  assert.equal(result.externalMutation, false);
  assert.equal(assessPromptAgentMission(result).independentlyVerified, true);
  assert.equal(assessPromptAgentMission(result).deploymentAuthorized, false);
});

test("test failure pauses before verification", async () => {
  const pending = await buildAgentFromOnePrompt(base(), adapters());
  approvePromptAgentBuild(pending, { actor: "founder", explicit: true, workspaceId: "repo-main" });
  const result = await buildAgentFromOnePrompt(pending, adapters({ testAgent: async () => ({ ok: false, reason: "unsafe tool call" }) }));
  assert.equal(result.status, "paused_tests_failed");
  assert.equal(result.evidence.verification, null);
});

test("independent verification failure blocks completion", async () => {
  const pending = await buildAgentFromOnePrompt(base(), adapters());
  approvePromptAgentBuild(pending, { actor: "founder", explicit: true, workspaceId: "repo-main" });
  const result = await buildAgentFromOnePrompt(pending, adapters({ verifyAgent: async () => ({ ok: false, reason: "policy violation" }) }));
  assert.equal(result.status, "paused_verification_failed");
  assert.notEqual(result.phase, "RECORDED");
});

test("adapter exception is recorded and does not escape orchestration", async () => {
  const result = await buildAgentFromOnePrompt(base(), adapters({ analyzePrompt: async () => { throw new Error("model unavailable"); } }));
  assert.equal(result.status, "paused_error");
  assert.match(result.blockers[0].reason, /model unavailable/);
});
