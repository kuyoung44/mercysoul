/**
 * MercySoul Vision Brain — Reverse Engine (VBRE)
 * Turns authorized observations into a traceable reconstruction blueprint.
 *
 * Pure policy/core functions only: no file access, process execution, network,
 * disassembly, repository mutation, or deployment occurs in this module.
 */
const TARGET_TYPES = new Set(["website", "web_app", "mobile_app", "desktop_app", "binary", "api", "workflow", "unknown"]);
const FINDING_STATES = new Set(["observed", "inferred", "unknown", "contradicted"]);
const EDGE_TYPES = new Set(["calls", "renders", "depends_on", "sends_to", "stores_in", "triggers", "implements", "observed_with"]);
const PHASES = Object.freeze([
  "INTAKE", "SCOPE_CHECK", "OBSERVATION", "EVIDENCE_MAP",
  "BEHAVIOR_MODEL", "RECONSTRUCTION_BLUEPRINT", "INDEPENDENT_REVIEW",
  "HUMAN_APPROVAL", "IMPLEMENTATION", "VALIDATION", "RECORDED"
]);

const requiredText = (value, label) => {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} is required`);
  return value.trim();
};

function uniqueIdSet(items, label) {
  const ids = new Set(items.map(x => x.id));
  if (ids.size !== items.length) throw new Error(`${label} IDs must be unique`);
  return ids;
}

/**
 * Create an investigation envelope. Authorization is explicit and target-bound;
 * no claim of legal ownership is inferred from a user's statement alone.
 */
export function createReverseMission(input = {}) {
  const target = input.target;
  if (!target || typeof target !== "object") throw new TypeError("Target metadata is required");
  const targetType = requiredText(target.type, "Target type");
  if (!TARGET_TYPES.has(targetType)) throw new Error(`Unsupported target type: ${targetType}`);
  const scope = Array.isArray(input.scope) ? [...new Set(input.scope.filter(x => typeof x === "string" && x.trim()).map(x => x.trim()))] : [];
  if (!scope.length) throw new Error("A bounded investigation scope is required");
  const authorization = input.authorization;
  const authorized = authorization?.explicit === true &&
    typeof authorization?.actor === "string" && authorization.actor.trim() &&
    typeof authorization?.basis === "string" && authorization.basis.trim() &&
    authorization?.targetId === target.id;
  return {
    schemaVersion: "mercysoul.vision-reverse-mission.v1",
    missionId: requiredText(input.missionId, "Mission id"),
    goal: requiredText(input.goal, "Mission goal"),
    target: {
      id: requiredText(target.id, "Target id"),
      type: targetType,
      fingerprint: typeof target.fingerprint === "string" ? target.fingerprint : null
    },
    scope,
    authorization: {
      authorized: Boolean(authorized),
      actor: authorized ? authorization.actor.trim() : null,
      basis: authorized ? authorization.basis.trim() : null,
      targetBound: Boolean(authorized)
    },
    phase: "INTAKE",
    findings: [],
    components: [],
    relationships: [],
    blueprint: null,
    approvals: [],
    audit: [{ event: "MISSION_CREATED", at: new Date().toISOString() }],
    policy: {
      readOnlyByDefault: true,
      externalMutation: false,
      targetContentIsUntrusted: true,
      humanJudgmentRequired: true
    }
  };
}

/** Advance only through declared phases; implementation needs explicit approval. */
export function advanceReverseMission(mission, nextPhase, { actor = "system", note = null } = {}) {
  if (!mission || mission.schemaVersion !== "mercysoul.vision-reverse-mission.v1") {
    throw new TypeError("Invalid reverse mission");
  }
  const current = PHASES.indexOf(mission.phase);
  const next = PHASES.indexOf(nextPhase);
  if (next < 0 || next !== current + 1) throw new Error("Reverse mission must advance one phase at a time");
  if (nextPhase === "SCOPE_CHECK" && !mission.authorization.authorized) {
    throw new Error("Explicit target-bound authorization is required before investigation");
  }
  if (nextPhase === "IMPLEMENTATION" && !mission.approvals.some(a => a.scope === "implement")) {
    throw new Error("Explicit human implementation approval is required");
  }
  if (nextPhase === "VALIDATION" && mission.phase !== "IMPLEMENTATION") {
    throw new Error("Validation requires an implementation phase");
  }
  return {
    ...mission,
    phase: nextPhase,
    audit: [...mission.audit, { event: "PHASE_ADVANCED", from: mission.phase, to: nextPhase, actor, note, at: new Date().toISOString() }]
  };
}

export function recordReverseFinding(mission, finding) {
  if (!mission || mission.schemaVersion !== "mercysoul.vision-reverse-mission.v1") throw new TypeError("Invalid reverse mission");
  if (!mission.authorization.authorized) throw new Error("Cannot record target findings before authorization");
  if (!["OBSERVATION", "EVIDENCE_MAP", "BEHAVIOR_MODEL"].includes(mission.phase)) {
    throw new Error("Findings can only be recorded during observation and modeling phases");
  }
  const status = finding?.status;
  if (!FINDING_STATES.has(status)) throw new Error("Finding status must be observed, inferred, unknown, or contradicted");
  const evidenceIds = Array.isArray(finding.evidenceIds) ? [...new Set(finding.evidenceIds)] : [];
  if (status === "observed" && evidenceIds.length === 0) throw new Error("Observed findings require evidence references");
  const normalized = {
    id: requiredText(finding.id, "Finding id"),
    statement: requiredText(finding.statement, "Finding statement"),
    status,
    evidenceIds,
    locator: typeof finding.locator === "string" ? finding.locator.slice(0, 1000) : null,
    limitation: typeof finding.limitation === "string" ? finding.limitation.slice(0, 2000) : null,
    targetContentUntrusted: true
  };
  if (mission.findings.some(x => x.id === normalized.id)) throw new Error("Finding IDs must be unique");
  return {
    ...mission,
    findings: [...mission.findings, normalized],
    audit: [...mission.audit, { event: "FINDING_RECORDED", findingId: normalized.id, status, at: new Date().toISOString() }]
  };
}

export function mapReverseComponent(mission, component) {
  if (!mission || mission.schemaVersion !== "mercysoul.vision-reverse-mission.v1") throw new TypeError("Invalid reverse mission");
  const item = {
    id: requiredText(component?.id, "Component id"),
    kind: requiredText(component?.kind, "Component kind"),
    observedName: typeof component?.observedName === "string" ? component.observedName : null,
    purpose: requiredText(component?.purpose, "Component purpose"),
    findingIds: Array.isArray(component?.findingIds) ? [...new Set(component.findingIds)] : []
  };
  const knownFindings = new Set(mission.findings.map(f => f.id));
  if (item.findingIds.some(id => !knownFindings.has(id))) throw new Error("Component references an unknown finding");
  if (mission.components.some(x => x.id === item.id)) throw new Error("Component IDs must be unique");
  return { ...mission, components: [...mission.components, item] };
}

export function mapReverseRelationship(mission, relationship) {
  if (!mission || mission.schemaVersion !== "mercysoul.vision-reverse-mission.v1") throw new TypeError("Invalid reverse mission");
  const edge = {
    id: requiredText(relationship?.id, "Relationship id"),
    from: requiredText(relationship?.from, "Relationship source"),
    to: requiredText(relationship?.to, "Relationship target"),
    type: requiredText(relationship?.type, "Relationship type"),
    findingIds: Array.isArray(relationship?.findingIds) ? [...new Set(relationship.findingIds)] : []
  };
  if (!EDGE_TYPES.has(edge.type)) throw new Error(`Unsupported relationship type: ${edge.type}`);
  const componentIds = new Set(mission.components.map(c => c.id));
  if (!componentIds.has(edge.from) || !componentIds.has(edge.to)) throw new Error("Relationship endpoints must be mapped components");
  const findingIds = new Set(mission.findings.map(f => f.id));
  if (edge.findingIds.some(id => !findingIds.has(id))) throw new Error("Relationship references an unknown finding");
  if (mission.relationships.some(x => x.id === edge.id)) throw new Error("Relationship IDs must be unique");
  return { ...mission, relationships: [...mission.relationships, edge] };
}

/** Produce a blueprint, never source code asserted to be the original. */
export function buildReconstructionBlueprint(mission) {
  if (!mission || mission.schemaVersion !== "mercysoul.vision-reverse-mission.v1") throw new TypeError("Invalid reverse mission");
  if (!mission.authorization.authorized) throw new Error("Authorized investigation is required");
  if (!["BEHAVIOR_MODEL", "RECONSTRUCTION_BLUEPRINT", "INDEPENDENT_REVIEW"].includes(mission.phase)) {
    throw new Error("Behavior model must be prepared before reconstruction");
  }
  const unsupportedObserved = mission.findings.filter(f => f.status === "observed" && f.evidenceIds.length === 0);
  if (unsupportedObserved.length) throw new Error("Observed findings must have evidence");
  const unknowns = mission.findings.filter(f => ["unknown", "contradicted"].includes(f.status));
  const inferences = mission.findings.filter(f => f.status === "inferred");
  const blueprint = {
    schemaVersion: "mercysoul.reconstruction-blueprint.v1",
    missionId: mission.missionId,
    target: mission.target,
    goal: mission.goal,
    components: mission.components,
    relationships: mission.relationships,
    requirements: mission.findings.map(f => ({
      id: `req-${f.id}`,
      statement: f.statement,
      basis: f.status,
      evidenceIds: f.evidenceIds,
      limitation: f.limitation
    })),
    unknowns: unknowns.map(f => ({ findingId: f.id, status: f.status, limitation: f.limitation })),
    inferences: inferences.map(f => ({ findingId: f.id, statement: f.statement, limitation: f.limitation })),
    acceptanceCriteria: [
      "Each implemented requirement maps to a finding and its evidence.",
      "Observed behavior is tested against the authorized reference or supplied fixtures.",
      "Unobserved behavior is labelled unknown rather than assumed.",
      "All deviations and unsupported areas are documented."
    ],
    nonClaims: [
      "This blueprint is not a recovery of the target's original source code.",
      "Static evidence alone does not prove runtime behavior.",
      "A complete reconstruction cannot be claimed until acceptance tests pass."
    ],
    createdAt: new Date().toISOString()
  };
  return { ...mission, blueprint, phase: "RECONSTRUCTION_BLUEPRINT", audit: [...mission.audit, { event: "BLUEPRINT_CREATED", at: new Date().toISOString() }] };
}

export function approveReverseAction(mission, { actor, scope, explicit = false } = {}) {
  if (!mission || mission.schemaVersion !== "mercysoul.vision-reverse-mission.v1") throw new TypeError("Invalid reverse mission");
  if (explicit !== true || typeof actor !== "string" || !actor.trim()) throw new Error("Explicit human approval is required");
  if (!["implement", "external_mutation", "deploy", "paid_resource"].includes(scope)) throw new Error("Approval scope is not recognized");
  if (scope === "implement" && !mission.blueprint) throw new Error("A reviewed reconstruction blueprint is required before implementation approval");
  const approval = { actor: actor.trim(), scope, at: new Date().toISOString() };
  return { ...mission, approvals: [...mission.approvals, approval], audit: [...mission.audit, { event: "HUMAN_APPROVAL_RECORDED", ...approval }] };
}

export function assessReverseMission(mission) {
  if (!mission || mission.schemaVersion !== "mercysoul.vision-reverse-mission.v1") throw new TypeError("Invalid reverse mission");
  return {
    missionId: mission.missionId,
    phase: mission.phase,
    authorized: mission.authorization.authorized,
    findingCount: mission.findings.length,
    observedCount: mission.findings.filter(f => f.status === "observed").length,
    inferredCount: mission.findings.filter(f => f.status === "inferred").length,
    unknownCount: mission.findings.filter(f => f.status === "unknown").length,
    contradictedCount: mission.findings.filter(f => f.status === "contradicted").length,
    componentCount: mission.components.length,
    relationshipCount: mission.relationships.length,
    blueprintReady: Boolean(mission.blueprint),
    implementationApproved: mission.approvals.some(a => a.scope === "implement"),
    externalMutation: false,
    nextGate: !mission.authorization.authorized ? "AUTHORIZE_TARGET" :
      !mission.blueprint ? "COMPLETE_EVIDENCE_AND_BLUEPRINT" :
      !mission.approvals.some(a => a.scope === "implement") ? "HUMAN_APPROVAL" : "CONTROLLED_IMPLEMENTATION"
  };
}

export { PHASES as REVERSE_ENGINE_PHASES };
