import { createHash, randomUUID } from "node:crypto";

export const VISION_BRAIN_VERSION = "0.1.0";
export const GOVERNANCE_PIPELINE = Object.freeze([
  "RECEIVE", "ROUTE", "THINK", "PLAN", "GUARDIAN",
  "APPROVE", "EXECUTE", "VERIFY", "RECOVER", "RECORD",
]);

const MUTATION_PATTERNS = [
  /\b(deploy|publish|send|charge|refund|delete|remove|write|update|modify|purchase|book|post)\b/i,
  /\b(change|alter|grant|revoke)\b.{0,40}\b(permission|access|database|production|account)\b/i,
];

const text = (value, max = 1000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

function routeIntent(request) {
  const explicitIntent = text(request.intent, 80).toLowerCase();
  if (explicitIntent) return explicitIntent;
  const value = text(request.message, 1000).toLowerCase();
  if (/\b(explain|what is|how does|why|compare|summari[sz]e|research)\b/.test(value)) return "answer";
  if (/\b(build|create|design|generate|draft|make)\b/.test(value)) return "create";
  if (/\b(check|inspect|review|audit|verify|test)\b/.test(value)) return "inspect";
  if (MUTATION_PATTERNS.some((pattern) => pattern.test(value))) return "external_action";
  return value ? "conversation" : "unknown";
}

function guardianReview(request, intent) {
  const message = text(request.message, 1000);
  const explicitMutation = request.externalMutation === true ||
    intent === "external_action" ||
    MUTATION_PATTERNS.some((pattern) => pattern.test(message));
  const missing = [];
  if (!message && !text(request.intent, 80)) missing.push("message_or_intent");
  if (explicitMutation && !text(request.scope, 300)) missing.push("exact_scope");
  return Object.freeze({
    decision: missing.length ? "block" : explicitMutation ? "require_approval" : "allow_plan_only",
    externalMutation: explicitMutation,
    approvalRequired: explicitMutation,
    executionAllowed: false,
    missing,
    reason: explicitMutation
      ? "Consequential actions require explicit, scope-bound human approval."
      : "Planning and explanation are non-executing operations.",
  });
}

/**
 * Deterministic, isolated Vision Brain foundation.
 * It produces a plan and Guardian decision only. It never calls a model,
 * provider, database, filesystem, deployment service, or external API.
 */
export function runVisionBrain(request = {}, options = {}) {
  const requestId = text(options.requestId, 120) || randomUUID();
  const message = text(request.message, 1000);
  const intent = routeIntent({ ...request, message });

  const plan = Object.freeze({
    objective: message || text(request.intent, 80) || "Clarify the requested objective",
    steps: intent === "inspect"
      ? ["Identify the target and evidence required", "Inspect without changing state", "Report findings and limitations"]
      : intent === "create"
        ? ["Clarify the desired output", "Prepare an isolated draft or implementation", "Validate before proposing integration"]
        : intent === "external_action"
          ? ["Define the exact target and scope", "Assess permissions and risks", "Request explicit human approval", "Do not execute in this release"]
          : ["Understand the request", "Prepare an answer or next-step recommendation"],
    mode: intent === "external_action" ? "approval_gated_plan" : "plan_only",
  });

  const guardian = guardianReview({ ...request, message }, intent);
  const unsigned = {
    requestId,
    engine: "MercySoul Vision Brain",
    version: VISION_BRAIN_VERSION,
    status: guardian.decision === "block" ? "blocked_missing_input" :
      guardian.approvalRequired ? "pending_human_approval" : "plan_ready",
    intent,
    plan,
    guardian,
    lifecycle: [
      { stage: "RECEIVE", status: "complete" },
      { stage: "ROUTE", status: "complete" },
      { stage: "THINK", status: "complete", method: "deterministic-foundation" },
      { stage: "PLAN", status: "complete" },
      { stage: "GUARDIAN", status: guardian.decision },
      { stage: "APPROVE", status: guardian.approvalRequired ? "pending" : "not_required_for_plan" },
      { stage: "EXECUTE", status: "disabled_in_foundation" },
      { stage: "VERIFY", status: "not_applicable_no_execution" },
      { stage: "RECOVER", status: "not_applicable_no_execution" },
      { stage: "RECORD", status: "response_digest_only" },
    ],
    executionAllowed: false,
    externalMutation: false,
    proposalDigest: hash({ requestId, intent, plan, guardian }),
    limitations: [
      "No language model is connected in this isolated foundation.",
      "No external action or production mutation can be executed.",
      "Approval validation and durable audit storage are not implemented here.",
    ],
  };

  return Object.freeze(unsigned);
}

export function visionBrainStatus() {
  return Object.freeze({
    name: "MercySoul Vision Brain",
    version: VISION_BRAIN_VERSION,
    mode: "isolated-deterministic-foundation",
    modelConfigured: false,
    executionEnabled: false,
    externalMutation: false,
    pipeline: [...GOVERNANCE_PIPELINE],
  });
}
