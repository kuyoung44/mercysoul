/**
 * MercySoul Mosaic-Inspired Governance Covenant.
 * Deterministic guardrail helper; it does not establish religious or legal authority.
 * Callers must provide verified facts and real authorization signals from trusted code.
 */
export const MOSAIC_COVENANT_VERSION = "1.0.0";

const highImpact = new Set(["external_mutation", "financial", "identity", "access_control", "data_disclosure", "enforcement", "deployment", "deletion"]);
const harmful = new Set(["violence", "threat", "fraud", "unauthorized_access", "privacy_violation", "retaliation", "coercion"]);

export function evaluateMosaicCovenant(input = {}) {
  const issues = [];
  const action = typeof input.actionType === "string" ? input.actionType : "unknown";
  const risk = typeof input.riskType === "string" ? input.riskType : "unknown";

  if (harmful.has(risk)) {
    issues.push({ code: "PROHIBITED_HARM", principle: "protect_life", reason: "The declared risk conflicts with the covenant." });
    return { decision: "deny", version: MOSAIC_COVENANT_VERSION, issues };
  }

  const consequential = input.consequential === true || highImpact.has(action);
  if (consequential && input.verifiedFacts !== true) {
    issues.push({ code: "FACTS_NOT_VERIFIED", principle: "truthful_witness", reason: "Consequential action requires verified facts." });
  }
  if (consequential && input.authorized !== true) {
    issues.push({ code: "AUTHORITY_NOT_VERIFIED", principle: "respect_property", reason: "Consequential action requires verified authorization." });
  }
  if (consequential && input.humanApproval !== true) {
    issues.push({ code: "HUMAN_APPROVAL_REQUIRED", principle: "impartial_justice", reason: "Consequential action requires explicit human approval or a separately documented pre-authorization." });
  }
  if (input.ambiguous === true || input.highImpact === true) {
    issues.push({ code: "HUMAN_REVIEW_REQUIRED", principle: "accountability", reason: "Ambiguous or high-impact cases require human review." });
  }
  if (input.privacyImpact === true && input.dataMinimized !== true) {
    issues.push({ code: "DATA_MINIMIZATION_REQUIRED", principle: "privacy_and_trust", reason: "Reduce data collection or disclosure before proceeding." });
  }

  if (issues.length > 0) {
    return { decision: "review", version: MOSAIC_COVENANT_VERSION, issues };
  }
  return { decision: "allow", version: MOSAIC_COVENANT_VERSION, issues: [] };
}
