import test from "node:test";
import assert from "node:assert/strict";
import {
  createBrainProposal,
  validateApproval,
  classifyAction,
  brainFoundationStatus,
} from "./policy.js";

const complete = {
  action: "deploy",
  scope: "preview branch only",
  objective: "Create a disposable preview deployment",
  owner: "founder",
  evidence: ["isolated branch", "no production target"],
  proposalId: "proposal-001",
};

const approvalFor = (proposal) => ({
  approved: true,
  approver: "founder",
  approvalId: "approval-001",
  proposalId: proposal.proposalId,
  scope: proposal.scope,
  action: proposal.action,
  objective: proposal.objective,
  owner: proposal.owner,
  expiresAt: "2026-11-16T13:00:00Z",
});

test("classifies known mutation actions as restricted", () => {
  assert.equal(classifyAction("delete").externalMutation, true);
  assert.equal(classifyAction("delete").requiresReview, true);
  assert.equal(classifyAction("summarize").externalMutation, false);
});

test("known read and planning requests remain plan-only", () => {
  const proposal = createBrainProposal({ ...complete, action: "analyze" });
  assert.equal(proposal.status, "plan_only");
  assert.equal(proposal.executionAllowed, false);
  assert.equal(proposal.requiresApproval, false);
});

test("mutation proposal requires explicit human approval", () => {
  const proposal = createBrainProposal(complete);
  assert.equal(proposal.status, "pending_human_approval");
  assert.equal(proposal.requiresApproval, true);
  assert.equal(proposal.externalMutation, true);
  assert.equal(proposal.executionAllowed, false);
});

test("unknown actions are restricted, never silently treated as safe", () => {
  const classification = classifyAction("transfer_funds");
  assert.equal(classification.classification, "unknown_restricted");
  assert.equal(classification.requiresReview, true);
  const proposal = createBrainProposal({ ...complete, action: "transfer_funds" });
  assert.equal(proposal.status, "pending_human_approval");
  assert.equal(proposal.requiresApproval, true);
  assert.equal(proposal.executionAllowed, false);
});

test("restricted proposals require a unique proposal ID", () => {
  const proposal = createBrainProposal({ ...complete, proposalId: undefined });
  assert.equal(proposal.status, "blocked_missing_information");
  assert.ok(proposal.missing.includes("unique_proposal_id"));
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

test("approval requires exact proposal, scope, action, objective, owner and future expiry", () => {
  const proposal = createBrainProposal(complete);
  const now = Date.parse("2026-11-16T12:00:00Z");
  const approval = approvalFor(proposal);
  const accepted = validateApproval(proposal, approval, now);
  assert.equal(accepted.authorized, true);
  assert.equal(accepted.executionAllowed, false);
  assert.equal(validateApproval(proposal, { ...approval, scope: "all production" }, now).authorized, false);
  assert.equal(validateApproval(proposal, { ...approval, action: "delete" }, now).authorized, false);
  assert.equal(validateApproval(proposal, { ...approval, objective: "Different objective" }, now).authorized, false);
  assert.equal(validateApproval(proposal, { ...approval, owner: "other-user" }, now).authorized, false);
  assert.equal(validateApproval(proposal, { ...approval, expiresAt: "2026-11-16T11:00:00Z" }, now).authorized, false);
});

test("approval validation is not authentication or execution", () => {
  const proposal = createBrainProposal(complete);
  const result = validateApproval(proposal, approvalFor(proposal), Date.parse("2026-11-16T12:00:00Z"));
  assert.equal(result.authorized, true);
  assert.equal(result.executionAllowed, false);
  assert.match(result.note, /not authentication or execution/);
});

test("status truthfully reports disconnected integrations and restricted unknown actions", () => {
  const status = brainFoundationStatus();
  assert.equal(status.modelConnected, false);
  assert.equal(status.memoryConnected, false);
  assert.equal(status.executionAdapterInstalled, false);
  assert.equal(status.unknownActionsRestricted, true);
});
