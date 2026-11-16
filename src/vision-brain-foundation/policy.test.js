import test from "node:test";
import assert from "node:assert/strict";
import { createBrainProposal, validateApproval, classifyAction, brainFoundationStatus } from "./policy.js";

const complete = {
  action: "deploy",
  scope: "preview branch only",
  objective: "Create a disposable preview deployment",
  owner: "founder",
  evidence: ["isolated branch", "no production target"],
  proposalId: "proposal-001",
};

test("classifies mutation actions", () => {
  assert.equal(classifyAction("delete").externalMutation, true);
  assert.equal(classifyAction("summarize").externalMutation, false);
});

test("complete read/plan request remains plan-only", () => {
  const proposal = createBrainProposal({ ...complete, action: "analyze" });
  assert.equal(proposal.status, "plan_only");
  assert.equal(proposal.executionAllowed, false);
  assert.equal(proposal.requiresApproval, false);
});

test("mutation proposal requires explicit human approval", () => {
  const proposal = createBrainProposal(complete);
  assert.equal(proposal.status, "pending_human_approval");
  assert.equal(proposal.requiresApproval, true);
  assert.equal(proposal.executionAllowed, false);
});

test("missing information blocks proposal", () => {
  const proposal = createBrainProposal({ action: "publish" });
  assert.equal(proposal.status, "blocked_missing_information");
  assert.ok(proposal.missing.includes("scope"));
  assert.equal(proposal.executionAllowed, false);
});

test("approval is rejected when absent", () => {
  const proposal = createBrainProposal(complete);
  const result = validateApproval(proposal, {}, Date.parse("2026-11-16T12:00:00Z"));
  assert.equal(result.authorized, false);
  assert.ok(result.reasons.includes("explicit_approval_required"));
});

test("approval requires exact proposal, scope, identity and future expiry", () => {
  const proposal = createBrainProposal(complete);
  const now = Date.parse("2026-11-16T12:00:00Z");
  const approval = {
    approved: true,
    approver: "founder",
    approvalId: "approval-001",
    proposalId: proposal.proposalId,
    scope: proposal.scope,
    expiresAt: "2026-11-16T13:00:00Z",
  };
  const accepted = validateApproval(proposal, approval, now);
  assert.equal(accepted.authorized, true);
  assert.equal(accepted.executionAllowed, false);
  assert.equal(validateApproval(proposal, { ...approval, scope: "all production" }, now).authorized, false);
  assert.equal(validateApproval(proposal, { ...approval, expiresAt: "2026-11-16T11:00:00Z" }, now).authorized, false);
});

test("status truthfully reports disconnected integrations", () => {
  const status = brainFoundationStatus();
  assert.equal(status.modelConnected, false);
  assert.equal(status.memoryConnected, false);
  assert.equal(status.executionAdapterInstalled, false);
});
