import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSensorAccess, normalizeSensorStatus, SENSOR_MANDATE_VERSION } from "./sensor-mandate.js";

const now = 1_800_000_000_000;
const request = {
  sensorType: "camera",
  purpose: "user_requested_preview",
  requestedScope: "preview_frame",
  tenantId: "tenant-a",
};
const validContext = {
  authenticated: true,
  tenantId: "tenant-a",
  authorized: true,
  purpose: "user_requested_preview",
  allowedScopes: ["preview_frame"],
  permissionState: "granted",
  consentState: "granted",
  verifiedAt: now - 1_000,
  maxVerificationAgeMs: 60_000,
  adapterConfigured: true,
  adapterHealthy: true,
};

test("allows only a fully verified, scoped request", () => {
  const result = evaluateSensorAccess(request, validContext, now);
  assert.equal(result.decision, "allow");
  assert.equal(result.mandateVersion, SENSOR_MANDATE_VERSION);
  assert.equal(result.auditRequired, true);
  assert.equal(result.rawPayloadPersistence, "disabled_by_default");
  assert.equal(result.consequentialActionsRequireSeparateApproval, true);
});

test("fails closed when authentication is missing", () => {
  assert.equal(evaluateSensorAccess(request, { ...validContext, authenticated: false }, now).decision, "deny");
});

test("fails closed on tenant mismatch and scope escalation", () => {
  assert.equal(evaluateSensorAccess(request, { ...validContext, tenantId: "tenant-b" }, now).reason, "tenant_scope_mismatch");
  assert.equal(evaluateSensorAccess(request, { ...validContext, allowedScopes: ["status_only"] }, now).reason, "scope_not_allowed");
});

test("fails closed on missing consent or revoked permissions", () => {
  assert.equal(evaluateSensorAccess(request, { ...validContext, consentState: "unknown" }, now).reason, "consent_not_granted");
  assert.equal(evaluateSensorAccess(request, { ...validContext, permissionState: "revoked" }, now).reason, "permission_revoked");
});

test("fails closed on stale authorization and unconfigured adapters", () => {
  assert.equal(evaluateSensorAccess(request, { ...validContext, verifiedAt: now - 120_000 }, now).reason, "authorization_verification_stale");
  assert.equal(evaluateSensorAccess(request, { ...validContext, adapterConfigured: false }, now).reason, "adapter_not_configured");
});

test("rejects unsupported sensor types and missing purpose", () => {
  assert.equal(evaluateSensorAccess({ ...request, sensorType: "mind_reading" }, validContext, now).reason, "unsupported_sensor_type");
  assert.equal(evaluateSensorAccess({ ...request, purpose: " " }, validContext, now).reason, "purpose_required");
});

test("status never reports a sensor available without a fresh verified observation", () => {
  assert.equal(normalizeSensorStatus({ configured: false }, now), "not_configured");
  assert.equal(normalizeSensorStatus({ configured: true, healthy: true, permissionState: "granted", lastObservedAt: now - 120_000 }, now), "stale");
  assert.equal(normalizeSensorStatus({ configured: true, healthy: true, permissionState: "granted", lastObservedAt: now - 1_000 }, now), "available");
});
