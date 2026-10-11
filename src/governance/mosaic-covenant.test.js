import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMosaicCovenant, MOSAIC_COVENANT_VERSION } from "./mosaic-covenant.js";

test("reports the covenant version", () => {
  assert.equal(MOSAIC_COVENANT_VERSION, "1.1.0");
});

test("denies declared harmful or retaliatory risk", () => {
  assert.equal(evaluateMosaicCovenant({ actionType: "external_mutation", riskType: "retaliation" }).decision, "deny");
});

test("reviews consequential action when facts are unverified", () => {
  const result = evaluateMosaicCovenant({ actionType: "deployment", authorized: true, humanApproval: true });
  assert.equal(result.decision, "review");
  assert.ok(result.issues.some(issue => issue.code === "FACTS_NOT_VERIFIED"));
});

test("requires authorization and human approval for consequential action", () => {
  const result = evaluateMosaicCovenant({ actionType: "deletion", verifiedFacts: true });
  assert.equal(result.decision, "review");
  assert.ok(result.issues.some(issue => issue.code === "AUTHORITY_NOT_VERIFIED"));
  assert.ok(result.issues.some(issue => issue.code === "HUMAN_APPROVAL_REQUIRED"));
});

test("routes ambiguous and high-impact cases to review", () => {
  assert.equal(evaluateMosaicCovenant({ actionType: "answer", ambiguous: true }).decision, "review");
  assert.equal(evaluateMosaicCovenant({ actionType: "answer", highImpact: true }).decision, "review");
});

test("requires data minimization when privacy impact is declared", () => {
  assert.equal(evaluateMosaicCovenant({ actionType: "answer", privacyImpact: true }).decision, "review");
  assert.equal(evaluateMosaicCovenant({ actionType: "answer", privacyImpact: true, dataMinimized: true }).decision, "allow");
});

test("routes rivalry and unresolved grievance to impartial de-escalation, not automatic punishment", () => {
  const result = evaluateMosaicCovenant({ actionType: "answer", interpersonalConflict: true });
  assert.equal(result.decision, "review");
  assert.ok(result.issues.some(issue => issue.code === "IMPARTIAL_DEESCALATION_REQUIRED"));
});

test("routes credible threat and immediate safety concerns to safety review", () => {
  const result = evaluateMosaicCovenant({ actionType: "answer", credibleThreat: true });
  assert.equal(result.decision, "review");
  assert.ok(result.issues.some(issue => issue.code === "SAFETY_REVIEW_REQUIRED"));
});

test("does not treat ordinary low-risk requests as consequential", () => {
  assert.equal(evaluateMosaicCovenant({ actionType: "answer", verifiedFacts: false }).decision, "allow");
});
