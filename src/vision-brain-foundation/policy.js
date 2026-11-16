/**
 * MercySoul Vision Brain — deterministic policy foundation.
 *
 * This module creates plans and validates approval records. It never performs
 * network calls, writes files, accesses databases, or executes provider actions.
 */

export const BRAIN_VERSION = "0.2.0";

export const LIFECYCLE = Object.freeze([
  "RECEIVE", "ROUTE", "THINK", "PLAN", "GUARDIAN",
  "APPROVE", "EXECUTE", "VERIFY", "RECOVER", "RECORD",
]);

const MUTATING = new Set([
  "write", "update", "delete", "deploy", "publish", "send",
  "charge", "refund", "permission_change", "credential_change",
  "database_mutation", "repository_mutation", "device_command",
  "external_api_mutation",
]);

// Only explicitly recognized read/planning verbs are safe by default.
// Unknown verbs are restricted rather than silently treated as harmless.
const SAFE_READ_OR_PLAN = new Set([
  "analyze", "classify", "draft", "estimate", "explain", "inspect",
  "plan", "read", "research", "review", "simulate", "summarize",
]);

const clean = (value, max = 240) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export function classifyAction(action) {
  const normalized = clean(action, 80).toLowerCase();
  if (MUTATING.has(normalized)) {
    return Object.freeze({
      action: normalized,
      externalMutation: true,
      requiresReview: true,
      classification: "mutation",
    });
  }
  if (SAFE_READ_OR_PLAN.has(normalized)) {
    return Object.freeze({
      action: normalized,
      externalMutation: false,
      requiresReview: false,
      classification: "read_or_plan",
    });
  }
  return Object.freeze({
    action: normalized || "unspecified",
    externalMutation: false,
    requiresReview: true,
    classification: "unknown_restricted",
  });
}

export function createBrainProposal(input = {}) {
  const classified = classifyAction(input.action);
  const scope = clean(input.scope);
  const objective = clean(input.objective, 600);
  const owner = clean(input.owner, 120);
  const proposalId = clean(input.proposalId, 100);
  const evidence = Array.isArray(input.evidence)
    ? input.evidence.filter((item) => typeof item === "string").map((item) => clean(item, 240)).filter(Boolean).slice(0, 8)
    : [];

  const requiresApproval = classified.requiresReview;
  const missing = [];
  if (!scope) missing.push("scope");
  if (!objective) missing.push("objective");
  if (!owner) missing.push("owner");
  if (!evidence.length) missing.push("evidence_or_explicit_assumption");
  if (requiresApproval && !proposalId) missing.push("unique_proposal_id");

  const status = missing.length
    ? "blocked_missing_information"
    : requiresApproval
      ? "pending_human_approval"
      : "plan_only";

  return Object.freeze({
    version: BRAIN_VERSION,
    proposalId: proposalId || "local-demo-proposal",
    action: classified.action,
    classification: classified.classification,
    scope,
    objective,
    owner,
    evidence,
    status,
    externalMutation: classified.externalMutation,
    requiresApproval,
    executionAllowed: false,
    missing,
    lifecycle: Object.freeze(["RECEIVE", "ROUTE", "THINK", "PLAN", "GUARDIAN"]),
    nextStep: missing.length ? "REQUEST_MISSING_INFORMATION" : requiresApproval ? "REQUEST_FOUNDER_APPROVAL" : "REVIEW_PLAN",
    note: "Proposal only. This foundation has no execution adapter.",
  });
}

/**
 * Validates a separately supplied approval claim. This is not authentication:
 * a future server-side adapter must authenticate the approver and re-check
 * permissions, proposal integrity, scope, expiry, and provider state.
 * A successful result still never enables execution in this module.
 */
export function validateApproval(proposal, approval = {}, now = Date.now()) {
  const reasons = [];
  if (!proposal || typeof proposal !== "object") reasons.push("proposal_required");
  if (proposal?.version !== BRAIN_VERSION) reasons.push("unsupported_proposal_version");
  if (!proposal?.requiresApproval) reasons.push("approval_only_applies_to_restricted_actions");
  if (proposal?.status !== "pending_human_approval") reasons.push("proposal_not_pending_approval");
  if (proposal?.missing?.length) reasons.push("proposal_has_missing_information");
  if (approval.approved !== true) reasons.push("explicit_approval_required");
  if (!clean(approval.approver, 120)) reasons.push("approver_required");
  if (!clean(approval.approvalId, 120)) reasons.push("approval_reference_required");
  if (clean(approval.proposalId, 100) !== proposal?.proposalId) reasons.push("proposal_id_mismatch");
  if (clean(approval.scope) !== proposal?.scope) reasons.push("approval_scope_mismatch");
  if (clean(approval.action, 80).toLowerCase() !== proposal?.action) reasons.push("approval_action_mismatch");
  if (clean(approval.objective, 600) !== proposal?.objective) reasons.push("approval_objective_mismatch");
  if (clean(approval.owner, 120) !== proposal?.owner) reasons.push("approval_owner_mismatch");
  const expiry = Date.parse(approval.expiresAt || "");
  if (!Number.isFinite(expiry) || expiry <= now) reasons.push("approval_expired_or_invalid");

  return Object.freeze({
    authorized: reasons.length === 0,
    executionAllowed: false,
    proposalId: proposal?.proposalId || null,
    checkedAt: new Date(now).toISOString(),
    reasons,
    nextStep: reasons.length ? "STOP_AND_REVIEW" : "HANDOFF_TO_SEPARATELY_AUTHORIZED_ADAPTER",
    note: "Approval validation is not authentication or execution. A separate trusted adapter must authenticate the approver and re-check permissions, proposal integrity, scope, expiry, and provider state.",
  });
}

export function brainFoundationStatus() {
  return Object.freeze({
    name: "MercySoul Vision Brain Foundation",
    version: BRAIN_VERSION,
    mode: "isolated_policy_prototype",
    modelConnected: false,
    memoryConnected: false,
    agentsConnected: false,
    executionAdapterInstalled: false,
    externalMutation: false,
    unknownActionsRestricted: true,
    defaultPolicy: "deny_mutation_and_unknown_actions_without_explicit_scoped_approval",
    lifecycle: [...LIFECYCLE],
  });
}
