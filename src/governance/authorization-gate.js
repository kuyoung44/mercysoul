const HIGH_RISK_ACTIONS = new Set([
  "deploy",
  "delete",
  "transfer",
  "change_permissions",
  "rotate_credentials",
  "change_production_config",
]);

const nonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

function deny(reason, extra = {}) {
  return { allowed: false, decision: "deny", reason, ...extra };
}

/**
 * Evaluate authorization using trusted server-side identity and permission data.
 * Never pass req.body or other client-controlled claims as principal/approval.
 * Approval persistence, single-use consumption, execution and audit logging belong
 * to the calling server adapter.
 */
export function authorizeAction({
  principal,
  resource,
  action,
  approval = null,
  now = Date.now(),
} = {}) {
  if (!principal || principal.authenticated !== true) {
    return deny("authentication_required");
  }
  if (principal.identityVerified !== true) {
    return deny("identity_verification_required");
  }
  if (!nonEmptyString(principal.subject)) {
    return deny("verified_subject_required");
  }
  if (!nonEmptyString(resource) || !nonEmptyString(action)) {
    return deny("resource_and_action_required");
  }
  if (!Array.isArray(principal.permissions)) {
    return deny("trusted_permissions_required");
  }

  const requiredPermission = `${resource.trim()}:${action.trim()}`;
  if (!principal.permissions.includes(requiredPermission)) {
    return deny("permission_not_granted", { requiredPermission });
  }

  const approvalRequired = HIGH_RISK_ACTIONS.has(action.trim());
  if (approvalRequired) {
    if (!approval || approval.status !== "approved") {
      return deny("explicit_approval_required", { approvalRequired: true });
    }
    if (
      approval.subject !== principal.subject ||
      approval.resource !== resource.trim() ||
      approval.action !== action.trim()
    ) {
      return deny("approval_scope_mismatch", { approvalRequired: true });
    }
    const expiresAt = Date.parse(approval.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
      return deny("approval_expired_or_invalid", { approvalRequired: true });
    }
    if (!nonEmptyString(approval.approvalId)) {
      return deny("approval_identifier_required", { approvalRequired: true });
    }
  }

  return {
    allowed: true,
    decision: "allow",
    reason: "identity_permission_and_policy_verified",
    subject: principal.subject,
    resource: resource.trim(),
    action: action.trim(),
    approvalRequired,
  };
}

export function isHighRiskAction(action) {
  return typeof action === "string" && HIGH_RISK_ACTIONS.has(action.trim());
}
