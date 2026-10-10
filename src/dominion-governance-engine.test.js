import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateRequest,
  authorizeProposal,
  appendAudit,
  verifyAuditEntry,
  getGovernanceStatus,
} from "./dominion-governance-engine.js";

test("blocks a mutation when scope, owner, issue, or permission is missing", () => {
  const proposal = evaluateRequest({
    action: "deploy",
    scope: "preview deployment only",
    externalMutation: true,
  });
  assert.equal(proposal.executionAllowed, false);
  assert.equal(proposal.status, "blocked_missing_evidence");
  assert.ok(proposal.missing.includes("owner"));
  assert.ok(proposal.missing.includes("issue_or_change_reference"));
  assert.ok(proposal.missing.includes("verified_permission"));
});

test("plans read-only requests without granting execution", () => {
  const proposal = evaluateRequest({
    action: "inspect",
    scope: "read repository status",
    owner: "maintainer",
    issue: "audit-001",
    externalMutation: false,
  });
  assert.equal(proposal.status, "plan_only");
  assert.equal(proposal.executionAllowed, false);
});

test("requires explicit, scoped, unexpired human approval for mutations", () => {
  const proposal = evaluateRequest({
    action: "deploy",
    scope: "preview deployment for PR 12",
    owner: "maintainer",
    issue: "PR-12",
    repoPermission: true,
    externalMutation: true,
  });
  const valid = authorizeProposal(proposal, {
    approved: true,
    approver: "human-maintainer",
    scope: proposal.scope,
    proposalId: proposal.proposalId,
    reason: "Reviewed preview deployment",
    approvalId: "approval-12",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(valid.authorized, true);
  assert.equal(valid.executionAllowed, false);
  assert.equal(valid.nextStep, "HANDOFF_TO_SEPARATELY_AUTHORIZED_ADAPTER");
});

test("rejects absent approval, mismatched scope, expired approval, and tampering", () => {
  const proposal = evaluateRequest({
    action: "delete",
    scope: "delete temporary preview only",
    owner: "maintainer",
    issue: "cleanup-01",
    repoPermission: true,
    externalMutation: true,
  });
  assert.equal(authorizeProposal(proposal, {}).authorized, false);
  const bad = authorizeProposal(proposal, {
    approved: true,
    approver: "human-maintainer",
    scope: "delete production",
    proposalId: proposal.proposalId,
    reason: "cleanup",
    approvalId: "approval-bad",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.ok(bad.reasons.includes("approval_scope_mismatch"));
  const tampered = { ...proposal, scope: "different scope" };
  assert.ok(authorizeProposal(tampered, {}).reasons.includes("proposal_integrity_check_failed"));
});

test("creates a verifiable audit chain and detects modified records", () => {
  const first = appendAudit(null, { eventType: "proposal_created", actor: "system", outcome: "pending" });
  const second = appendAudit(first, { eventType: "approval_checked", actor: "guardian", outcome: "denied" });
  assert.equal(first.previousHash, "GENESIS");
  assert.equal(second.previousHash, first.hash);
  assert.equal(verifyAuditEntry(first), true);
  assert.equal(verifyAuditEntry(second), true);
  assert.equal(verifyAuditEntry({ ...second, outcome: "approved" }), false);
});

test("reports no installed executor and no claimed durable audit", () => {
  const status = getGovernanceStatus();
  assert.equal(status.externalMutation, false);
  assert.equal(status.executionAdapterInstalled, false);
  assert.equal(status.durableAuditConfigured, false);
  assert.equal(status.humanJudgmentRequired, true);
});
