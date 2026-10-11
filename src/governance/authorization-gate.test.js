import test from "node:test";
import assert from "node:assert/strict";
import { authorizeAction, isHighRiskAction } from "./authorization-gate.js";

const principal = {
  authenticated: true,
  identityVerified: true,
  subject: "user-123",
  permissions: ["repo:read", "production:deploy"],
};
const approval = {
  status: "approved",
  subject: "user-123",
  resource: "production",
  action: "deploy",
  approvalId: "approval-456",
  expiresAt: "2099-01-01T00:00:00.000Z",
};

test("denies missing authentication", () => {
  assert.equal(authorizeAction({ principal: null, resource: "repo", action: "read" }).reason, "authentication_required");
});

test("denies identity not verified", () => {
  assert.equal(authorizeAction({ principal: { ...principal, identityVerified: false }, resource: "repo", action: "read" }).reason, "identity_verification_required");
});

test("denies missing permission by default", () => {
  assert.equal(authorizeAction({ principal, resource: "repo", action: "delete" }).allowed, false);
});

test("allows exact low-risk permission", () => {
  const result = authorizeAction({ principal, resource: "repo", action: "read" });
  assert.equal(result.allowed, true);
  assert.equal(result.decision, "allow");
});

test("denies high-risk action without approval", () => {
  assert.equal(authorizeAction({ principal, resource: "production", action: "deploy" }).reason, "explicit_approval_required");
});

test("allows high-risk action with matching unexpired approval", () => {
  const result = authorizeAction({ principal, resource: "production", action: "deploy", approval, now: Date.parse("2026-01-01T00:00:00.000Z") });
  assert.equal(result.allowed, true);
  assert.equal(result.approvalRequired, true);
});

test("denies approval scoped to a different action", () => {
  const result = authorizeAction({ principal, resource: "production", action: "deploy", approval: { ...approval, action: "delete" } });
  assert.equal(result.reason, "approval_scope_mismatch");
});

test("denies expired approval", () => {
  const result = authorizeAction({ principal, resource: "production", action: "deploy", approval: { ...approval, expiresAt: "2000-01-01T00:00:00.000Z" } });
  assert.equal(result.reason, "approval_expired_or_invalid");
});

test("denies missing resource or action", () => {
  assert.equal(authorizeAction({ principal, resource: "", action: "read" }).reason, "resource_and_action_required");
});

test("identifies high-risk actions", () => {
  assert.equal(isHighRiskAction("delete"), true);
  assert.equal(isHighRiskAction("read"), false);
});
