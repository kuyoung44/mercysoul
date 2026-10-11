import test from "node:test";
import assert from "node:assert/strict";
import { resolveConfiguredPrincipal } from "./authorization-middleware.js";

test("rejects a missing or mismatched bearer token", () => {
  assert.equal(resolveConfiguredPrincipal({
    bearerToken: "wrong",
    expectedToken: "expected",
    subject: "founder",
    identityVerified: true,
    permissions: ["engine:plan"],
  }).status, 401);
});

test("fails closed when identity attestation is absent", () => {
  const result = resolveConfiguredPrincipal({
    bearerToken: "expected",
    expectedToken: "expected",
    subject: "founder",
    identityVerified: false,
    permissions: ["engine:plan"],
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "trusted_identity_not_configured");
});

test("fails closed when scoped permissions are missing", () => {
  const result = resolveConfiguredPrincipal({
    bearerToken: "expected",
    expectedToken: "expected",
    subject: "founder",
    identityVerified: true,
    permissions: [],
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "scoped_permissions_not_configured");
});

test("resolves only a configured, authenticated, scoped principal", () => {
  const result = resolveConfiguredPrincipal({
    bearerToken: "expected",
    expectedToken: "expected",
    subject: "founder",
    identityVerified: true,
    permissions: ["engine:plan", "engine:plan", ""],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.principal.permissions, ["engine:plan"]);
});

test("rejects an empty configured secret", () => {
  assert.equal(resolveConfiguredPrincipal({
    bearerToken: "",
    expectedToken: "",
    subject: "founder",
    identityVerified: true,
    permissions: ["engine:plan"],
  }).ok, false);
});
