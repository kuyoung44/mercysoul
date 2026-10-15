/**
 * MercySoul Evidence Engine — normalization and evidence policy boundary.
 *
 * This module does not execute REA or launch analysis providers. It accepts
 * caller-supplied analysis output and preserves the distinction between
 * observed evidence, inference, and unknowns.
 */
const CLAIM_STATUSES = new Set(["supported", "inferred", "unknown", "contradicted"]);
const SOURCE_KINDS = new Set(["binary", "source", "application", "website", "runtime", "tool"]);

function nonEmpty(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} is required`);
  return value.trim();
}

function cleanEvidence(item, index) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new TypeError(`Evidence item ${index + 1} must be an object`);
  }
  const sourceKind = nonEmpty(item.sourceKind, `Evidence item ${index + 1} sourceKind`);
  if (!SOURCE_KINDS.has(sourceKind)) throw new Error(`Unsupported evidence sourceKind: ${sourceKind}`);
  const locator = nonEmpty(item.locator, `Evidence item ${index + 1} locator`);
  const description = nonEmpty(item.description, `Evidence item ${index + 1} description`);
  return {
    id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `evidence-${index + 1}`,
    sourceKind,
    locator,
    description,
    excerpt: typeof item.excerpt === "string" ? item.excerpt.slice(0, 4000) : null,
    targetContentUntrusted: true
  };
}

function cleanClaim(claim, index, evidenceIds) {
  if (!claim || typeof claim !== "object" || Array.isArray(claim)) {
    throw new TypeError(`Claim ${index + 1} must be an object`);
  }
  const statement = nonEmpty(claim.statement, `Claim ${index + 1} statement`);
  if (!CLAIM_STATUSES.has(claim.status)) throw new Error(`Claim ${index + 1} has an invalid status`);
  const refs = Array.isArray(claim.evidenceIds) ? [...new Set(claim.evidenceIds)] : [];
  for (const ref of refs) {
    if (!evidenceIds.has(ref)) throw new Error(`Claim references missing evidence: ${ref}`);
  }
  if (claim.status === "supported" && refs.length === 0) {
    throw new Error("A supported claim must reference at least one evidence item");
  }
  if (claim.status === "unknown" && refs.length > 0 && claim.note == null) {
    // Unknown can have partial evidence, but the limitation must be explicit.
    throw new Error("An unknown claim with evidence requires a limitation note");
  }
  return {
    id: typeof claim.id === "string" && claim.id.trim() ? claim.id.trim() : `claim-${index + 1}`,
    statement,
    status: claim.status,
    evidenceIds: refs,
    note: typeof claim.note === "string" ? claim.note.slice(0, 2000) : null
  };
}

export function createEvidenceReport(input = {}) {
  const target = input.target;
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    throw new TypeError("Target metadata is required");
  }
  const targetId = nonEmpty(target.id, "Target id");
  const targetKind = nonEmpty(target.kind, "Target kind");
  const evidence = (Array.isArray(input.evidence) ? input.evidence : []).map(cleanEvidence);
  const evidenceIds = new Set(evidence.map(item => item.id));
  if (evidenceIds.size !== evidence.length) throw new Error("Evidence IDs must be unique");
  const claims = (Array.isArray(input.claims) ? input.claims : []).map((claim, index) =>
    cleanClaim(claim, index, evidenceIds)
  );
  const claimIds = new Set(claims.map(claim => claim.id));
  if (claimIds.size !== claims.length) throw new Error("Claim IDs must be unique");

  return {
    schemaVersion: "mercysoul.evidence-report.v1",
    reportId: nonEmpty(input.reportId, "Report id"),
    target: {
      id: targetId,
      kind: targetKind,
      sha256: typeof target.sha256 === "string" && /^[a-f0-9]{64}$/i.test(target.sha256) ? target.sha256.toLowerCase() : null
    },
    provider: {
      name: nonEmpty(input.provider?.name, "Provider name"),
      version: typeof input.provider?.version === "string" ? input.provider.version : null
    },
    evidence,
    claims,
    limitations: [...new Set((Array.isArray(input.limitations) ? input.limitations : [])
      .filter(value => typeof value === "string" && value.trim()).map(value => value.trim()))],
    policy: {
      analysisOnly: true,
      externalMutation: false,
      targetContentUntrusted: true,
      humanJudgmentRequired: true
    },
    createdAt: typeof input.createdAt === "string" ? input.createdAt : new Date().toISOString()
  };
}

/** Summarize verification readiness without asserting technical truth. */
export function assessEvidenceReport(report) {
  if (!report || report.schemaVersion !== "mercysoul.evidence-report.v1") {
    throw new TypeError("Unsupported evidence report");
  }
  const supportedWithoutEvidence = report.claims.filter(claim =>
    claim.status === "supported" && (!Array.isArray(claim.evidenceIds) || claim.evidenceIds.length === 0)
  );
  const unknownCount = report.claims.filter(claim => claim.status === "unknown").length;
  const contradictedCount = report.claims.filter(claim => claim.status === "contradicted").length;
  const inferredCount = report.claims.filter(claim => claim.status === "inferred").length;
  return {
    structurallyValid: supportedWithoutEvidence.length === 0,
    claimCount: report.claims.length,
    evidenceCount: report.evidence.length,
    inferredCount,
    unknownCount,
    contradictedCount,
    readyForIndependentReview: supportedWithoutEvidence.length === 0 && report.claims.length > 0,
    deployAuthorized: false
  };
}
