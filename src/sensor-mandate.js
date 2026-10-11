/**
 * MercySoul SI Sensor Mandate v1.0
 *
 * Policy evaluation only. This module does not access hardware, grant platform
 * permissions, or prove that a sensor is connected.
 */

export const SENSOR_MANDATE_VERSION = "1.0.0";

export const SENSOR_TYPES = Object.freeze([
  "camera",
  "microphone",
  "location",
  "device_health",
  "network_event",
  "application_event",
  "provider_signal",
]);

const VALID_PERMISSION_STATES = new Set(["granted", "denied", "unknown", "revoked"]);
const VALID_CONSENT_STATES = new Set(["granted", "denied", "unknown", "revoked"]);

function deny(reason) {
  return Object.freeze({
    decision: "deny",
    reason,
    mandateVersion: SENSOR_MANDATE_VERSION,
    policyOnly: true,
  });
}

/**
 * Evaluate an access request from trusted, server-validated context.
 * The caller must still enforce the decision and record an audit event.
 */
export function evaluateSensorAccess(request = {}, context = {}, now = Date.now()) {
  if (!request || typeof request !== "object" || !context || typeof context !== "object") {
    return deny("invalid_request");
  }

  const {
    sensorType,
    purpose,
    requestedScope,
    tenantId,
  } = request;

  if (!SENSOR_TYPES.includes(sensorType)) return deny("unsupported_sensor_type");
  if (typeof purpose !== "string" || !purpose.trim()) return deny("purpose_required");
  if (typeof requestedScope !== "string" || !requestedScope.trim()) return deny("scope_required");
  if (typeof tenantId !== "string" || !tenantId.trim()) return deny("tenant_required");

  if (context.authenticated !== true) return deny("authentication_required");
  if (context.tenantId !== tenantId) return deny("tenant_scope_mismatch");
  if (context.authorized !== true) return deny("authorization_required");
  if (context.purpose !== purpose) return deny("purpose_mismatch");
  if (context.allowedScopes === undefined || !Array.isArray(context.allowedScopes)) {
    return deny("scope_not_verified");
  }
  if (!context.allowedScopes.includes(requestedScope)) return deny("scope_not_allowed");

  if (!VALID_PERMISSION_STATES.has(context.permissionState)) {
    return deny("permission_state_invalid");
  }
  if (context.permissionState !== "granted") {
    return deny(context.permissionState === "revoked" ? "permission_revoked" : "permission_not_granted");
  }

  if (!VALID_CONSENT_STATES.has(context.consentState)) {
    return deny("consent_state_invalid");
  }
  if (context.consentState !== "granted") {
    return deny(context.consentState === "revoked" ? "consent_revoked" : "consent_not_granted");
  }

  if (!Number.isFinite(context.verifiedAt) || context.verifiedAt > now) {
    return deny("verification_timestamp_invalid");
  }
  const maxAgeMs = Number.isFinite(context.maxVerificationAgeMs)
    ? context.maxVerificationAgeMs
    : 60_000;
  if (maxAgeMs < 0 || now - context.verifiedAt > maxAgeMs) {
    return deny("authorization_verification_stale");
  }

  if (context.adapterConfigured !== true) return deny("adapter_not_configured");
  if (context.adapterHealthy !== true) return deny("adapter_not_healthy");

  return Object.freeze({
    decision: "allow",
    reason: "verified_authorized_sensor_request",
    mandateVersion: SENSOR_MANDATE_VERSION,
    policyOnly: true,
    sensorType,
    purpose,
    scope: requestedScope,
    tenantId,
    auditRequired: true,
    rawPayloadPersistence: "disabled_by_default",
    consequentialActionsRequireSeparateApproval: true,
  });
}

/** Safe status helper: never infer hardware connectivity from UI presence. */
export function normalizeSensorStatus({ configured = false, healthy = false, permissionState = "unknown", lastObservedAt = null } = {}, now = Date.now(), maxAgeMs = 60_000) {
  if (!configured) return "not_configured";
  if (permissionState === "denied") return "denied";
  if (permissionState === "revoked") return "denied";
  if (permissionState !== "granted") return "unavailable";
  if (!healthy) return "error";
  if (!Number.isFinite(lastObservedAt) || lastObservedAt > now || now - lastObservedAt > maxAgeMs) return "stale";
  return "available";
}
