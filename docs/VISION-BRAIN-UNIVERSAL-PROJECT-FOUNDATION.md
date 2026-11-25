# MercySoul Vision Brain — Universal Project Foundation

## Scope

This change introduces a pure, side-effect-free project foundation. It creates normalized project records, validates task graphs, derives deterministic task order, produces an execution-disabled plan, classifies capability readiness, and enforces scoped approval checks for consequential actions.

It does **not** add a worker runtime, database schema, persistence adapter, provider connection, shell access, filesystem access, deployment path, or autonomous execution. Those integrations require separate review and approval.

## Project lifecycle contract

The foundation is designed to fit the MercySoul lifecycle:

`RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD`

This phase implements the project definition and planning boundary. Execution remains disabled in generated plans.

## Project record

A record includes:

- Stable project ID and schema version
- Goal, domains, constraints, acceptance criteria
- Complexity level (L0–L4)
- Requested capabilities and project risk
- Tasks, dependencies, and deterministic topological order
- Approval history placeholder, deliverables, and verification status
- Creation and update timestamps

Task IDs must be unique. Dependencies must refer to known tasks. Cyclic dependencies are rejected.

## Capability readiness

Capability states are deliberately distinct: registered, connected, available, executable, verified, and approved. None of these states alone grants execution permission. A project-scoped approval is still required for a consequential action.

## Guardian boundary

Read-only actions can pass without a write approval. Sensitive reads are classified separately. Reversible writes, consequential writes, financial actions, and production-critical actions fail closed unless an active approval matches the exact project ID, action type, and resource. Approval must have a valid approval timestamp and future expiry and must not be revoked. Prohibited actions always fail closed.

The approval check is a policy primitive, not an execution adapter. Callers must still authenticate the actor, persist the approval record, enforce one-time use where applicable, audit the decision, and re-check current policy immediately before any external mutation.

## Usage

```js
import {
  createProjectRecord,
  createProjectPlan,
  authorizeProjectAction,
} from './universal-project.js';

const project = createProjectRecord({
  goal: 'Build a customer portal',
  domains: ['software', 'operations'],
  tasks: [
    { id: 'design', title: 'Design portal' },
    { id: 'build', title: 'Build portal', dependsOn: ['design'] },
  ],
});

const plan = createProjectPlan(project);
// plan.executionEnabled === false
// plan.requiresHumanApproval === true

const decision = authorizeProjectAction({
  projectId: project.id,
  action: { type: 'deploy', risk: 'production-critical' },
  resource: 'production',
  approval: null,
});
// decision.allowed === false
```

## Verification

Run:

```sh
node --test src/orchestrator/universal-project.test.js
node --check src/orchestrator/universal-project.js
```

The tests cover validation, complexity, dependency ordering and cycle detection, safe plan defaults, capability-state separation, exact approval scope, expiry, revocation, and prohibited actions.

## Explicit non-goals

- No Supabase migrations or production SQL
- No RLS, grants, secrets, or environment changes
- No model-provider calls
- No network, shell, filesystem, or browser execution
- No email, payment, publishing, or deployment
- No automatic retries or background workers
