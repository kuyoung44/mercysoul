/**
 * MercySoul Vision Brain — deterministic policy foundation.
 *
 * This module creates plans and validates approval records. It never performs
 * network calls, writes files, accesses databases, or executes provider actions.
 */

export const BRAIN_VERSION = "0.1.0";

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

const clean = (value, max = 240) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export function classifyAction(action) {
  const normalized = clean(action, 80).toLowerCase();
  return Object.freeze({
    action: normalized || "unspecified",
    externalMutation: MUTATING.has(normalized),
    classification: MUTATING.has(normalized) ? "mutation" : "read_or_plan",
  });
}

export function createBrainProposal(input = {}) {
  const classified = classifyAction(input.action);
  const scope = clean(input.scope);
  const objective = clean(input.objective, 600);
  const owner = clean(input.owner, 120);
  const evidence = Array.isArray(input.evidence)
    ? input.evidence.filter((item) => typeof item === "string").map((item) => clean(item, 240)).filter(Boolean).slice(0, 8)
    : [];

  const missing = [];
  if (!scope) missing.push("scope");
  if (!objective) missing.push("objective");
  if (!owner) missing.push("owner");
  if (!evidence.length) missing.push("evidence_or_explicit_assumption");

  const externalMutation = classified.externalMutation;
  const status = missing.length
    ? "blocked_missing_information"
    : externalMutation
      ? "pending_human_approval"
      : "plan_only";

  return Object.freeze({
    version: BRAIN_VERSION,
    proposalId: clean(input.proposalId, 100) || "local-demo-proposal",
    action: classified.action,
    classification: classified.classification,
    scope,
    objective,
    owner,
    evidence,
    status,
    externalMutation,
    requiresApproval: externalMutation,
    executionAllowed: false,
    missing,
    lifecycle: Object.freeze(["RECEIVE", "ROUTE", "THINK", "PLAN", "GUARDIAN"]),
    nextStep: missing.length ? "REQUEST_MISSING_INFORMATION" : externalMutation ? "REQUEST_FOUNDER_APPROVAL" : "REVIEW_PLAN",
    note: "Proposal only. This foundation has no execution adapter.",
  });
}

/**
 * Validates a separately supplied approval. A successful result still does
 * not execute anything and always returns executionAllowed=false.
 */
export function validateApproval(proposal, approval = {}, now = Date.now()) {
  const reasons = [];
  if (!proposal || typeof proposal !== "object") reasons.push("proposal_required");
  if (proposal?.version !== BRAIN_VERSION) reasons.push("unsupported_proposal_version");
  if (!proposal?.externalMutation || !proposal?.requiresApproval) reasons.push("approval_only_applies_to_mutations");
  if (proposal?.missing?.length) reasons.push("proposal_has_missing_information");
  if (approval.approved !== true) reasons.push("explicit_approval_required");
  if (!clean(approval.approver, 120)) reasons.push("approver_required");
  if (!clean(approval.approvalId, 120)) reasons.push("approval_reference_required");
  if (clean(approval.proposalId, 100) !== proposal?.proposalId) reasons.push("proposal_id_mismatch");
  if (clean(approval.scope) !== proposal?.scope) reasons.push("approval_scope_mismatch");
  const expiry = Date.parse(approval.expiresAt || "");
  if (!Number.isFinite(expiry) || expiry <= now) reasons.push("approval_expired_or_invalid");

  return Object.freeze({
    authorized: reasons.length === 0,
    executionAllowed: false,
    proposalId: proposal?.proposalId || null,
    checkedAt: new Date(now).toISOString(),
    reasons,
    nextStep: reasons.length ? "STOP_AND_REVIEW" : "HANDOFF_TO_SEPARATELY_AUTHORIZED_ADAPTER",
    note: "Approval validation is not execution. A separate adapter must re-check identity, permissions, scope, expiry, and provider state.",
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
    defaultPolicy: "deny_mutation_without_explicit_scoped_approval",
    lifecycle: [...LIFECYCLE],
  });
}
