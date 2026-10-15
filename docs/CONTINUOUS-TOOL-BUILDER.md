# MercySoul Vision Brain — Continuous Tool Builder

## Purpose
Create a reusable, bounded orchestration layer that identifies missing project capabilities, plans tools, requests the required workspace-bound approval, builds through injected adapters, tests outputs, obtains independent verification, and records results. The engine can repeat repair cycles within a configured limit.

## Lifecycle
`INTAKE → ANALYZE → CAPABILITY_GAP → TOOL_PLAN → BUILD → TEST → INDEPENDENT_VERIFY → INTEGRATE → REVIEW → RECORDED`

A failed build or test may schedule another bounded cycle. Missing authorization, missing adapters, failed independent verification, unresolved failures, or cycle limits cause a recorded pause rather than a false success.

## Adapter contract
The pure module accepts host-provided functions:
- `analyze({ project, goal, workspace, scope, cycle })` returns `{ ok: true, requirements: [{ id, capability, reason, acceptanceCriteria, risk }] }`.
- `build({ project, workspace, tool, cycle })` returns `{ ok: true, artifact }`.
- `test({ tool, project })` returns `{ ok: true, evidence }`.
- `verify({ mission, tools })` independently checks the generated outputs and returns `{ ok: true, evidence }` only when its checks pass.
- Optional `integrate({ mission, tools })` is gated by explicit integration approval.

All adapter output is untrusted until validated. Adapters must independently enforce workspace confinement, safe code-generation practices, dependency policy, resource limits, and least privilege. This module does not run shell commands, install dependencies, access the filesystem, connect to networks, or deploy.

## Authorization
Authorization must be explicit and bound to the exact project and workspace. Each tool build requires a human approval record scoped to that workspace. Integration requires its own approval. Deployment, purchases, and external mutations are not enabled by this generic engine. Use a separately reviewed and explicitly authorized execution route for consequential actions.

## Continuous mode
Cycles are bounded (maximum 10); planned tools are bounded (maximum 30). A host scheduler can resume eligible paused missions from durable state, but must re-check authorization, workspace identity, approvals, and current policy on every resume. Do not use an unbounded loop or infer permission from a prior unrelated project.

## Status
This is an orchestration core and adapter contract, not a live autonomous worker. It becomes operational only after reviewed host adapters, durable state, audit persistence, workspace isolation, and runtime scheduling are integrated and tested. No deployment or external mutation is performed by this module.
