# MercySoul Dominion — Brain Foundation

**Status:** Stage 1 foundation / isolated prototype  
**Branch:** feat/dominion-brain-foundation  
**Production impact:** none

## Purpose

Create one governed intelligence foundation that can later coordinate MercySoul's agents, business services, world platform, and robotics interfaces. The brain proposes and verifies work; it is not an unrestricted executor.

## Logical architecture

```text
Human / App / Voice / Future Robot
              |
       RECEIVE + IDENTITY
              |
        ROUTER / INTENT
              |
       VISION BRAIN (THINK)
              |
        PLANNER (PLAN)
              |
    GUARDIAN + POLICY EVALUATION
              |
       APPROVAL REGISTRY
              |
  AUTHORIZED ADAPTER (future, separate)
              |
   EXECUTION -> VERIFY -> RECOVER
              |
         AUDIT RECORD
```

## Core components

- **Interface layer:** web, mobile, voice, and future robot clients. Interfaces submit requests; they do not receive credentials.
- **Vision Brain:** model adapter, conversation context, task decomposition, and structured outputs. Model providers are replaceable.
- **Agent registry:** named, narrowly scoped agents with declared capabilities. Agents return proposals and evidence.
- **Guardian:** evaluates risk, permissions, scope, and whether an action is external or irreversible.
- **Approval registry:** records a human approval tied to one proposal, one scope, an approver, and an expiry.
- **Execution adapters:** separate provider-specific modules. Not part of this prototype.
- **Trace and evaluation:** request IDs, lifecycle events, test cases, latency/cost/error metrics, and regression checks.
- **Memory:** explicit, tenant-scoped, purpose-limited memory with retention and deletion policies. No cross-customer memory.

## Governance contract

Lifecycle: RECEIVE -> ROUTE -> THINK -> PLAN -> GUARDIAN -> APPROVE -> EXECUTE -> VERIFY -> RECOVER -> RECORD.

1. Default is plan-only.
2. External mutations are always held for explicit, current, scoped human approval.
3. A proposal is not an authorization; an authorization is not execution.
4. Approval never bypasses identity, permission, expiry, or provider-state checks.
5. This prototype has **no execution adapter**, no provider credentials, and no database writes.
6. Production SQL, schema, RLS, grants, migrations, deployments, and customer data remain locked pending separate founder approval.

## Initial agent roles

| Agent | Initial responsibility | Forbidden by default |
|---|---|---|
| Research | Gather and summarize evidence | Publish or contact |
| Builder | Draft code and implementation plans | Merge or deploy |
| Business | Explain offerings and draft replies | Quote binding terms, charge, send |
| Creative | Generate creative briefs and assets | Publish without approval |
| Guardian | Inspect scope, risk, and policy | Approve on the founder's behalf |
| Operations | Produce checklists and status reports | Change infrastructure |
| Robotics | Simulate commands and sensor interpretation | Move physical hardware |

## Hybrid deployment direction

- **Phone:** founder console, approvals, monitoring, and emergency stop.
- **Cloud:** model gateway, stateless APIs, agent orchestration, encrypted storage when approved.
- **Local / future hardware:** robot bridge and offline-safe command queue. Hardware commands require a separate safety controller and physical emergency stop.

## Build stages

1. **Foundation (this branch):** architecture, deterministic policy engine, test suite, isolated browser lab.
2. Model adapter: connect a provider behind a stable interface; secrets remain server-side.
3. Agent registry and trace/evaluation pipeline.
4. Explicit memory and tenant isolation design; database proposal only.
5. Business assistant integration and controlled human handoff.
6. World platform, creator tools, and knowledge archive.
7. Robot simulation, then hardware bridge after safety review.

## Acceptance criteria for this foundation

- Every proposal is plan-only or pending approval.
- Mutating actions cannot be marked executable by this module.
- Approval validation is separate from execution.
- Invalid, missing, mismatched, or expired approvals are rejected.
- Tests run with Node's built-in test runner.
- Browser lab works without API keys, network calls, or database access.
