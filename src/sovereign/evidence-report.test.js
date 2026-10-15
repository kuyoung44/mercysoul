import test from "node:test";
import assert from "node:assert/strict";
import { createEvidenceReport, assessEvidenceReport } from "./evidence-report.js";

const base = {
  reportId: "scan-001",
  target: { id: "sample-app", kind: "application", sha256: "a".repeat(64) },
  provider: { name: "rea-mcp", version: "unverified" },
  evidence: [{ id: "ev-1", sourceKind: "binary", locator: "0x401000", description: "Function entry observed", excerpt: "target-provided content" }],
  claims: [{ id: "cl-1", statement: "A function entry was observed at 0x401000", status: "supported", evidenceIds: ["ev-1"] }],
  limitations: ["Provider output has not been independently verified."]
};

test("creates a bounded evidence report and never grants deployment authority", () => {
  const report = createEvidenceReport(base);
  assert.equal(report.schemaVersion, "mercysoul.evidence-report.v1");
  assert.equal(report.target.sha256, "a".repeat(64));
  assert.equal(report.evidence[0].targetContentUntrusted, true);
  assert.equal(report.policy.externalMutation, false);
  assert.equal(assessEvidenceReport(report).deployAuthorized, false);
});

test("rejects a supported claim without evidence", () => {
  assert.throws(() => createEvidenceReport({ ...base, claims: [
    { statement: "It works", status: "supported", evidenceIds: [] }
  ] }), /must reference at least one evidence item/);
});

test("rejects references to evidence that does not exist", () => {
  assert.throws(() => createEvidenceReport({ ...base, claims: [
    { statement: "It works", status: "supported", evidenceIds: ["missing"] }
  ] }), /missing evidence/);
});

test("rejects duplicate evidence identifiers", () => {
  assert.throws(() => createEvidenceReport({ ...base, evidence: [
    ...base.evidence, ...base.evidence
  ] }), /Evidence IDs must be unique/);
});

test("unknown claims with partial evidence require a limitation note", () => {
  assert.throws(() => createEvidenceReport({ ...base, claims: [
    { statement: "Runtime target may exist", status: "unknown", evidenceIds: ["ev-1"] }
  ] }), /limitation note/);
});

test("inference and unknowns remain visible in review readiness", () => {
  const report = createEvidenceReport({ ...base, claims: [
    { statement: "Likely a search handler", status: "inferred", evidenceIds: ["ev-1"] },
    { statement: "Runtime behavior not observed", status: "unknown", evidenceIds: [], note: "Static-only scan" }
  ] });
  const summary = assessEvidenceReport(report);
  assert.equal(summary.inferredCount, 1);
  assert.equal(summary.unknownCount, 1);
  assert.equal(summary.readyForIndependentReview, true);
});
