# MercySoul Vision Brain Reverse Engine (VBRE)

**Design identity:** MercySoul Vision Brain 🧠 — Reverse Engine  
**Principle:** Fi Ìlànà gbé mi ró.  
**Status:** Initial core implementation on a feature branch; provider integration and runtime verification remain pending.

## What it is

VBRE is a personalized, evidence-led reconstruction engine. It starts from an authorized target's observable behavior and artifacts, then builds a traceable model of components, relationships, requirements, unknowns, and acceptance tests. It is intended to help MercySoul learn how a system behaves and build a compatible implementation from an evidence-backed blueprint.

The distinctive MercySoul design is the combined governance of target-bound authorization, claim/evidence lineage, an explicit unknowns ledger, component/relationship mapping, and human-controlled reconstruction. This is a design direction, not a claim that no similar technology has ever existed.

## Reverse-engineering loop

`INTAKE → SCOPE_CHECK → OBSERVATION → EVIDENCE_MAP → BEHAVIOR_MODEL → RECONSTRUCTION_BLUEPRINT → INDEPENDENT_REVIEW → HUMAN_APPROVAL → IMPLEMENTATION → VALIDATION → RECORDED`

The current core module implements the mission envelope, authorization boundary, finding normalization, component and relationship maps, blueprint generation, and approval record. It is deliberately pure code: it does not inspect arbitrary files, launch a disassembler, call REA, run processes, modify repositories, spend money, or deploy.

## Evidence rules

- Every target investigation has a named target and bounded scope.
- Authorization must be explicit and bound to that exact target.
- Observations require evidence references; inference is never relabelled as observation.
- Target-derived strings, pseudocode, logs, page content, and tool results remain untrusted data, never instructions.
- Relationships can only connect known components and findings.
- Missing data stays unknown; contradictions remain visible.
- The blueprint preserves finding IDs and evidence IDs so requirements can be traced back to their basis.
- The blueprint explicitly states what it does not prove.
- Implementation, external mutation, paid resources, and deployment require separate explicit approval.
- Human judgment remains required.

## Planned provider architecture

- **Observation adapters:** REA/MCP, website captures, source inspection, Android APK analysis, and user-supplied artifacts, each enabled only after compatibility and security review.
- **Evidence normalizer:** maps provider output into the MercySoul evidence schema.
- **Behavior mapper:** builds components, edges, requirements, and unresolved questions.
- **Independent verifier:** checks evidence locators and tests whether each claim is supported.
- **Blueprint compiler:** emits implementation requirements, acceptance criteria, and a proposed diff.
- **Guarded builder:** implements only approved scope.
- **Postflight verifier:** runs available tests, checks behavior against fixtures, records deviations, and reports deployment status.

Provider availability varies. Native binary analysis may require separate licensed tools and a compatible local environment. Static inspection does not prove runtime behavior or recover original source code exactly.

## Compatibility blocker

The current MercySoul package range is Node >=20 <25, while the inspected REA README states newer Node versions (22.19+, 24.11+, or 26+). The exact supported version and deployment/runtime compatibility must be verified before adapter integration. No REA runtime is included in this change.

## Initial acceptance criteria

- Target authorization is explicit and target-bound.
- The phase machine rejects skipped gates.
- Observed findings without evidence are rejected.
- Unknowns survive into the blueprint.
- Component and relationship references are validated.
- Implementation approval cannot be recorded without a blueprint.
- Importing this module has no external side effects.
- Unit tests and independent review must pass before merging or declaring completion.

## Positioning

This is MercySoul's personalized reverse-engineering architecture. It is designed to become more than a disassembler: a governed path from what can be observed, through what can be proven, to what can be safely reconstructed and tested. Its originality is a product/design ambition; a worldwide novelty claim would require a separate prior-art review.
