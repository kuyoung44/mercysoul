import { createHash, randomUUID } from "node:crypto";

export const DOMINION_VERSION = "1.0.0";
export const LIFECYCLE = Object.freeze([
  "RECEIVE", "ROUTE", "THINK", "PLAN", "GUARDIAN",
  "APPROVE", "EXECUTE", "VERIFY", "RECOVER", "RECORD",
]);

const MUTATING_ACTIONS = new Set([
  "write", "update", "delete", "deploy", "publish", "send",
  "charge", "refund", "permission_change", "credential_change",
  "database_mutation", "repository_mutation", "external_api_mutation",
]);

const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

function safeText(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Evaluate a proposed operation. This engine never executes provider actions.
 * External mutations are always held until a scoped, unexpired human approval
 * is supplied to a separate, authorized execution adapter.
 */
export function evaluateRequest(input = {}) {
  const action = safeText(input.action, 80).toLowerCase();
  const scope = safeText(input.scope, 300);
  const owner = safeText(input.owner, 120);
  const issue = safeText(input.issue, 300);
  const repoPermission = input.repoPermission === true;
  const externalMutation = input.externalMutation === true ||
    MUTATING_ACTIONS.has(action);
  const missing = [];
  if (!action) missing.push("action");
  if (!scope) missing.push("scope");
  if (!owner) missing.push("owner");
  if (!issue) missing.push("issue_or_change_reference");
  if (externalMutation && !repoPermission) missing.push("verified_permission");

  const requiresApproval = externalMutation;
  const status = missing.length
    ? "blocked_missing_evidence"
    : requiresApproval
      ? "pending_human_approval"
      : "plan_only";

  const proposal = {
    proposalId: randomUUID(),
    engineVersion: DOMINION_VERSION,
    status,
    action: action || "unspecified",
    scope,
    owner,
    issue,
    externalMutation,
    repoPermission,
    requiresApproval,
    humanJudgmentRequired: true,
    executionAllowed: false,
    missing,
    lifecycle: ["RECEIVE", "ROUTE", "THINK", "PLAN", "GUARDIAN"],
    createdAt: new Date().toISOString(),
  };
  return Object.freeze({ ...proposal, proposalDigest: digest(proposal) });
}

export function authorizeProposal(proposal, approval = {}, now = Date.now()) {
  const reasons = [];
  if (!proposal || typeof proposal !== "object") reasons.push("proposal_required");
  if (proposal?.engineVersion !== DOMINION_VERSION) reasons.push("unsupported_engine_version");
  if (!proposal?.proposalId || !proposal?.proposalDigest) reasons.push("proposal_integrity_fields_missing");
  if (proposal?.proposalDigest) {
    const { proposalDigest, ...unsigned } = proposal;
    if (digest(unsigned) !== proposalDigest) reasons.push("proposal_integrity_check_failed");
  }
  if (!proposal?.externalMutation) reasons.push("proposal_is_not_a_mutation");
  if (!proposal?.requiresApproval) reasons.push("approval_gate_not_set");
  if (proposal?.missing?.length) reasons.push("proposal_has_unresolved_requirements");
  if (approval?.approved !== true) reasons.push("explicit_approval_required");
  if (!safeText(approval.approver, 120)) reasons.push("approver_identity_required");
  if (!safeText(approval.scope, 300) || approval.scope !== proposal?.scope) reasons.push("approval_scope_mismatch");
  if (!safeText(approval.proposalId, 100) || approval.proposalId !== proposal?.proposalId) reasons.push("proposal_id_mismatch");
  if (!safeText(approval.reason, 500)) reasons.push("approval_reason_required");
  if (!Number.isFinite(Date.parse(approval.expiresAt ?? "")) || Date.parse(approval.expiresAt) <= now) reasons.push("approval_expired_or_invalid");
  if (!safeText(approval.approvalId, 120)) reasons.push("approval_reference_required");

  return Object.freeze({
    authorized: reasons.length === 0,
    executionAllowed: false,
    proposalId: proposal?.proposalId ?? null,
    approvalId: safeText(approval.approvalId, 120) || null,
    checkedAt: new Date(now).toISOString(),
    reasons,
    nextStep: reasons.length ? "STOP_AND_REVIEW" : "HANDOFF_TO_SEPARATELY_AUTHORIZED_ADAPTER",
    note: "Authorization validation is not execution. The adapter must re-check identity, permissions, scope, expiry, and provider state.",
  });
}

/** Append-only, tamper-evident in-memory audit helper; persist externally as needed. */
export function appendAudit(previous = null, event = {}) {
  const body = {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    engineVersion: DOMINION_VERSION,
    previousHash: previous?.hash ?? "GENESIS",
    eventType: safeText(event.eventType, 100) || "unspecified",
    proposalId: safeText(event.proposalId, 100) || null,
    actor: safeText(event.actor, 120) || "system",
    outcome: safeText(event.outcome, 120) || "recorded",
    details: event.details && typeof event.details === "object" ? event.details : {},
  };
  return Object.freeze({ ...body, hash: digest(body) });
}

export function verifyAuditEntry(entry) {
  if (!entry || typeof entry !== "object" || typeof entry.hash !== "string") return false;
  const { hash, ...body } = entry;
  return digest(body) === hash;
}

export function getGovernanceStatus() {
  return Object.freeze({
    engine: "MercySoul Dominion Governance Engine",
    version: DOMINION_VERSION,
    lifecycle: [...LIFECYCLE],
    defaultPolicy: "deny_mutation_without_explicit_scoped_approval",
    externalMutation: false,
    humanJudgmentRequired: true,
    conversationMode: {
      name: "NATURAL CONVERSATION MODE",
      version: "1.0",
      enabled: true,
      corePrinciple: "Natural conversation by default. Structured reasoning when needed. Authorization before consequential action.",
      integratedInto: "src/agent/personal-bot.js",
      governanceBypass: false,
    },
    executionAdapterInstalled: false,
    durableAuditConfigured: false,
    claims: "Policy evaluation and audit helpers only; no external systems are controlled by this module.",
  });
}
