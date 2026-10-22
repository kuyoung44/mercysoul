import crypto from "node:crypto";
import { authorizeAction } from "./authorization-gate.js";

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""), "utf8");
  const b = Buffer.from(String(right || ""), "utf8");
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function resolveConfiguredPrincipal({
  bearerToken,
  expectedToken,
  subject,
  identityVerified,
  permissions,
} = {}) {
  if (!safeEqual(bearerToken, expectedToken)) {
    return { ok: false, status: 401, reason: "authentication_required" };
  }
  if (typeof subject !== "string" || !subject.trim() || identityVerified !== true) {
    return { ok: false, status: 503, reason: "trusted_identity_not_configured" };
  }
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return { ok: false, status: 503, reason: "scoped_permissions_not_configured" };
  }
  return {
    ok: true,
    principal: {
      authenticated: true,
      identityVerified: true,
      subject: subject.trim(),
      permissions: [...new Set(permissions.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()))],
    },
  };
}

/**
 * Protect a route using a configured admin bearer token plus explicit deployment
 * attestation of the subject/identity and a least-privilege permission list.
 * This is not an external identity-provider integration. Only set the identity
 * attestation after the operator has verified the identity through a trusted process.
 */
export function createAuthorizationMiddleware({ config, resource, actionForRequest }) {
  return (req, res, next) => {
    const bearerToken = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const permissions = String(process.env.MERCYSOUL_ADMIN_PERMISSIONS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const principalResult = resolveConfiguredPrincipal({
      bearerToken,
      expectedToken: config?.ADMIN_API_TOKEN,
      subject: process.env.MERCYSOUL_ADMIN_SUBJECT,
      identityVerified: process.env.MERCYSOUL_ADMIN_IDENTITY_VERIFIED === "true",
      permissions,
    });

    if (!principalResult.ok) {
      const status = principalResult.status;
      return res.status(status).json({
        ok: false,
        decision: "deny",
        code: status === 503 ? "AUTHORIZATION_GATE_NOT_CONFIGURED" : "AUTHENTICATION_REQUIRED",
        reason: principalResult.reason,
        requestId: req.requestId || null,
      });
    }

    const action = typeof actionForRequest === "function" ? actionForRequest(req) : actionForRequest;
    const decision = authorizeAction({
      principal: principalResult.principal,
      resource,
      action,
      // Deliberately do not accept approval claims from req.body or headers.
      // A trusted, durable, single-use approval store must be integrated separately.
    });

    if (!decision.allowed) {
      return res.status(403).json({
        ok: false,
        decision: "deny",
        code: "AUTHORIZATION_DENIED",
        reason: decision.reason,
        requestId: req.requestId || null,
      });
    }

    req.mercySoulPrincipal = principalResult.principal;
    req.mercySoulAuthorization = decision;
    return next();
  };
}
