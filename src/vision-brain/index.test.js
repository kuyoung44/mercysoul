import test from "node:test";
import assert from "node:assert/strict";
import { runVisionBrain, visionBrainStatus } from "./index.js";

test("routes a creation request into a bounded plan", () => {
  const result = runVisionBrain({ message: "Build a demo website" });
  assert.equal(result.intent, "create");
  assert.equal(result.status, "plan_ready");
  assert.equal(result.executionAllowed, false);
  assert.equal(result.externalMutation, false);
  assert.ok(result.plan.steps.length >= 2);
});

test("keeps consequential actions pending approval and never executes", () => {
  const result = runVisionBrain({
    message: "Deploy the new version to production",
    scope: "production deployment",
  });
  assert.equal(result.intent, "external_action");
  assert.equal(result.status, "pending_human_approval");
  assert.equal(result.guardian.decision, "require_approval");
  assert.equal(result.guardian.approvalRequired, true);
  assert.equal(result.executionAllowed, false);
  assert.equal(result.externalMutation, false);
  assert.equal(result.lifecycle.find((item) => item.stage === "EXECUTE").status, "disabled_in_foundation");
});

test("blocks a mutation request without an exact scope", () => {
  const result = runVisionBrain({ message: "Delete the production database" });
  assert.equal(result.status, "blocked_missing_input");
  assert.ok(result.guardian.missing.includes("exact_scope"));
  assert.equal(result.executionAllowed, false);
});

test("handles empty input without throwing or executing", () => {
  const result = runVisionBrain({});
  assert.equal(result.status, "blocked_missing_input");
  assert.equal(result.executionAllowed, false);
});

test("status is honest about model and execution configuration", () => {
  const status = visionBrainStatus();
  assert.equal(status.modelConfigured, false);
  assert.equal(status.executionEnabled, false);
  assert.equal(status.externalMutation, false);
  assert.ok(status.pipeline.includes("GUARDIAN"));
});

test("returns a stable digest for the same request id and plan", () => {
  const first = runVisionBrain({ message: "Explain the architecture" }, { requestId: "test-1" });
  const second = runVisionBrain({ message: "Explain the architecture" }, { requestId: "test-1" });
  assert.equal(first.proposalDigest, second.proposalDigest);
});
