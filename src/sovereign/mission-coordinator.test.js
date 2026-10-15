import test from "node:test";
import assert from "node:assert/strict";
import {
  approveMission, buildMissionPlan, createMission, selectCreationResource, transitionMission
} from "./mission-coordinator.js";

test("creation plan coordinates specialized agents", () => {
  const plan = buildMissionPlan("Build a website");
  assert.ok(plan.length >= 5);
  assert.equal(plan[0].agent, "vision");
  assert.ok(plan.some(item => item.agent === "guardian"));
});

test("free-first selection does not select paid resources without approval", () => {
  const resources = [
    { id: "paid-api", tier: "paid", supported: true, estimatedCost: 10 },
    { id: "free-model", tier: "free", supported: true, estimatedCost: 0 },
    { id: "local-model", tier: "local", supported: true, estimatedCost: 0 }
  ];
  assert.equal(selectCreationResource(resources).id, "local-model");
  assert.equal(selectCreationResource(resources, { paidResourceApproved: true }).id, "local-model");
  assert.equal(selectCreationResource([{ id: "paid", tier: "paid", supported: true }]), null);
});

test("deployment requires explicit approval and verification requires passing evidence", () => {
  let mission = createMission({ id: "m-1", goal: "Build safely" });
  mission = transitionMission(mission, "PLANNING");
  mission = transitionMission(mission, "BUILDING");
  mission = transitionMission(mission, "TESTING");
  mission = transitionMission(mission, "READY_FOR_APPROVAL");
  assert.throws(() => transitionMission(mission, "DEPLOYED"), /approval/i);
  mission = approveMission(mission, { actor: "founder", scope: "deploy", explicit: true });
  mission = transitionMission(mission, "DEPLOYED", { actor: "founder" });
  assert.throws(() => transitionMission(mission, "VERIFIED"), /passing evidence/i);
  mission = transitionMission(mission, "VERIFIED", { evidence: { passed: true } });
  assert.equal(mission.status, "VERIFIED");
  assert.ok(mission.audit.length >= 7);
});

test("mission transitions reject invalid jumps", () => {
  const mission = createMission({ id: "m-2", goal: "Create" });
  assert.throws(() => transitionMission(mission, "DEPLOYED"), /Invalid mission transition/);
});
