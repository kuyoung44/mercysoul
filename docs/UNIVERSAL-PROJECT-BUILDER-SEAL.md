# MercySoul Universal Project Builder — Sealed Product Principle

**Status:** Governing product requirement; implementation and production readiness must be verified separately.  
**Principle:** Complexity changes the plan, resources, sequencing, and time required—not whether MercySoul accepts a project prompt.

## Sealed rule

MercySoul Vision Brain must accept a natural-language prompt for any project scope it can reasonably assess, including simple creative work, websites, software systems, AI agents, enterprise platforms, and research or engineering projects. It must translate the request into a structured, reviewable plan and coordinate available capabilities toward a verified deliverable.

Universal intake is not a promise that every project can be completed immediately or with currently available tools. When a requirement cannot be fulfilled, MercySoul must identify the missing capability, dependency, credential, resource, evidence, or permission; explain the limitation; and continue with safe, useful work where possible. It must never claim an unbuilt capability or unverified result.

## Required lifecycle

`RECEIVE → UNDERSTAND → DECOMPOSE → PLAN → GUARDIAN → APPROVE → BUILD → TEST → REPAIR → VERIFY → DELIVER/DEPLOY → RECORD`

- **Receive:** Preserve the user's stated objective and constraints.
- **Understand:** Produce explicit requirements, assumptions, acceptance criteria, and unresolved questions.
- **Decompose:** Create a dependency-aware task graph that can exceed one execution cycle.
- **Plan:** Estimate capabilities, resources, risks, milestones, and verification methods.
- **Guardian:** Apply least privilege, privacy, security, policy, budget, and operational checks.
- **Approve:** Require human approval for consequential actions and keep approval scoped to the exact project, workspace, and action.
- **Build:** Use reviewed, workspace-confined adapters and specialized builders; treat generated artifacts and adapter output as untrusted until checked.
- **Test:** Collect reproducible test evidence against acceptance criteria.
- **Repair:** Diagnose and retry within explicit cycle, time, cost, and resource budgets. Stop and report when limits are reached.
- **Verify:** Independently assess the deliverable against the original requirements; do not let a builder certify its own success without independent checks.
- **Deliver/deploy:** Report verified artifacts and remaining gaps. Deployment and other external mutations require separate, explicit authorization and successful required checks.
- **Record:** Persist task state, decisions, approvals, evidence, failures, and recovery checkpoints so work can resume safely.

## Complexity and resumability

1. Support staged execution across multiple runs for projects larger than one cycle.
2. Maintain durable, versioned project specifications, task states, dependencies, checkpoints, and audit records.
3. Revalidate project identity, workspace, authorization, approval scope, and current policy on every resume.
4. Bound retries, concurrency, runtime, spending, and resource use; avoid unbounded autonomous loops.
5. Continue independent tasks when safe, but block tasks whose dependencies, authorization, or safety checks have failed.
6. Make partial completion explicit. Never label a project complete solely because code was generated or a deployment was requested.

## Non-negotiable governance

- **Fi Ìlànà gbé mi ró** — let principle and discipline uphold me.
- No approval means no consequential external execution.
- No license means no implied permission.
- Human judgment remains required for consequential decisions.
- AI must not claim religious authority, demand surrender of human judgment, or present uncertain output as unquestionable truth.
- Prefer proportionate, least-intrusive actions; pause when authority, evidence, or safety is unclear.
- Preserve user control, auditability, recovery, and the ability to stop execution.

## Acceptance criteria for implementation

The rule is not considered implemented merely because this document exists. A production implementation must demonstrate, with tests and observable evidence, that it can:

1. Convert one prompt into a validated project specification, acceptance criteria, and dependency-aware task graph.
2. Coordinate at least two distinct builder/tool capabilities through explicit adapter contracts.
3. Persist and resume a multi-stage project without losing verified progress.
4. Enforce project/workspace-bound authorization and distinct approval for consequential integrations or deployment.
5. Enforce retry and resource budgets and safely pause on exhaustion.
6. Test generated outputs and require independent verification before reporting success.
7. Record approvals, state transitions, test evidence, errors, and recovery events.
8. Report unsupported requirements honestly and distinguish planned, generated, tested, verified, and deployed states.
9. Pass focused tests and the repository's required CI checks.
10. Have deployment health verified before production readiness is claimed.

## Current implementation boundary

The one-prompt agent builder and continuous tool builder are foundations, not proof of a complete universal project orchestrator. This seal establishes the product requirement and acceptance bar. Runtime adapters, durable orchestration, end-to-end tests, and deployment health must be inspected and verified separately before the system is described as operational.
