import test from "node:test";
import assert from "node:assert/strict";
import {
  createReverseMission, advanceReverseMission, recordReverseFinding,
  mapReverseComponent, mapReverseRelationship, buildReconstructionBlueprint,
  approveReverseAction, assessReverseMission
} from "./vision-reverse-engine.js";

function authorizedMission() {
  return createReverseMission({
    missionId: "vbre-001",
    goal: "Reconstruct a website's visible navigation behavior",
    target: { id: "owned-demo-site", type: "website", fingerprint: "sha256:demo" },
    scope: ["public pages", "navigation links", "layout behavior"],
    authorization: { explicit: true, actor: "founder", basis: "owner authorization", targetId: "owned-demo-site" }
  });
}
function toModelPhase(m) {
  m = advanceReverseMission(m, "SCOPE_CHECK");
  m = advanceReverseMission(m, "OBSERVATION");
  m = advanceReverseMission(m, "EVIDENCE_MAP");
  return advanceReverseMission(m, "BEHAVIOR_MODEL");
}

test("authorization must be explicit and bound to the exact target", () => {
  const m = createReverseMission({
    missionId: "no-auth", goal: "Inspect", target: { id: "x", type: "binary" },
    scope: ["metadata"], authorization: { explicit: true, actor: "founder", basis: "permission", targetId: "other" }
  });
  assert.equal(m.authorization.authorized, false);
  assert.throws(() => advanceReverseMission(m, "SCOPE_CHECK"), /authorization/);
});

test("observed findings require evidence and target content remains untrusted", () => {
  let m = advanceReverseMission(authorizedMission(), "SCOPE_CHECK");
  m = advanceReverseMission(m, "OBSERVATION");
  assert.throws(() => recordReverseFinding(m, { id: "f1", statement: "Button exists", status: "observed" }), /require evidence/);
  m = recordReverseFinding(m, { id: "f1", statement: "Navigation link observed", status: "observed", evidenceIds: ["ev1"], locator: "page:/about#nav" });
  assert.equal(m.findings[0].targetContentUntrusted, true);
});

test("blueprint preserves evidence lineage and unknowns", () => {
  let m = toModelPhase(authorizedMission());
  m = recordReverseFinding(m, { id: "f1", statement: "Home link routes to root", status: "observed", evidenceIds: ["ev1"], locator: "page:/#home-link" });
  m = recordReverseFinding(m, { id: "f2", statement: "Mobile menu animation timing", status: "unknown", limitation: "No mobile capture supplied" });
  m = mapReverseComponent(m, { id: "nav", kind: "component", observedName: "primary-nav", purpose: "Expose site navigation", findingIds: ["f1"] });
  m = mapReverseComponent(m, { id: "home", kind: "route", purpose: "Home page" });
  m = mapReverseRelationship(m, { id: "edge1", from: "nav", to: "home", type: "renders", findingIds: ["f1"] });
  m = buildReconstructionBlueprint(m);
  assert.equal(m.blueprint.requirements[0].evidenceIds[0], "ev1");
  assert.equal(m.blueprint.unknowns[0].findingId, "f2");
  assert.ok(m.blueprint.nonClaims.length >= 2);
  assert.equal(assessReverseMission(m).externalMutation, false);
});

test("relationships must reference known components and allowed edge types", () => {
  const m = toModelPhase(authorizedMission());
  assert.throws(() => mapReverseRelationship(m, { id: "e", from: "missing", to: "also-missing", type: "calls" }), /endpoints/);
});

test("implementation approval requires a blueprint and explicit human approval", () => {
  const m = toModelPhase(authorizedMission());
  assert.throws(() => approveReverseAction(m, { actor: "founder", scope: "implement", explicit: true }), /blueprint/);
});

test("phase transitions cannot skip gates", () => {
  const m = authorizedMission();
  assert.throws(() => advanceReverseMission(m, "BEHAVIOR_MODEL"), /one phase at a time/);
});
