import test from "node:test";
import assert from "node:assert/strict";
import { createReaAdapter } from "./rea-adapter.js";
import { createReverseMission } from "./vision-reverse-engine.js";

const mission = createReverseMission({
  missionId: "adapter-test",
  goal: "Analyze an authorized local demo",
  target: { id: "demo-target", type: "web_app" },
  scope: ["static application analysis"],
  authorization: { explicit: true, actor: "founder", basis: "owner authorization", targetId: "demo-target" }
});

test("rejects missing configured MCP caller", () => {
  assert.throws(() => createReaAdapter(), /invokeTool/);
});

test("rejects unapproved analysis without invoking provider", async () => {
  let calls = 0;
  const adapter = createReaAdapter({ invokeTool: async () => { calls++; return {}; }, permittedTargets: ["demo-target"] });
  await assert.rejects(adapter.analyze({
    mission, targetId: "demo-target", targetRef: "/approved/demo", scope: "static application analysis"
  }), /approval/);
  assert.equal(calls, 0);
});

test("rejects targets outside the exact allowlist", async () => {
  const adapter = createReaAdapter({ invokeTool: async () => ({}), permittedTargets: ["another-target"] });
  await assert.rejects(adapter.analyze({
    mission, targetId: "demo-target", targetRef: "/approved/demo", scope: "static application analysis", approved: true
  }), /allowlist/);
});

test("passes bounded, approved requests through injected caller and marks output untrusted", async () => {
  const calls = [];
  const adapter = createReaAdapter({
    toolName: "analyze_javascript_application",
    permittedTargets: ["demo-target"],
    invokeTool: async (name, args) => { calls.push({ name, args }); return { finding: "example" }; }
  });
  const observation = await adapter.analyze({
    mission, targetId: "demo-target", targetRef: "/approved/demo",
    scope: "static application analysis", approved: true
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, "analyze_javascript_application");
  assert.equal(observation.resultIsUntrusted, true);
  assert.equal(observation.policy.externalMutation, false);
});

test("rejects out-of-scope analysis", async () => {
  const adapter = createReaAdapter({ invokeTool: async () => ({}), permittedTargets: ["demo-target"] });
  await assert.rejects(adapter.analyze({
    mission, targetId: "demo-target", targetRef: "/approved/demo",
    scope: "native binary extraction", approved: true
  }), /outside the mission scope/);
});
