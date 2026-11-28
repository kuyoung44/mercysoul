# MercySoul Autonomous Operations Engine — v1 foundation

This directory contains a deterministic orchestration kernel for a supervised multi-agent workflow. It is an extension point for MercySoul OS, not a claim that the repository is already a production-grade autonomous platform.

## Agent responsibilities

- **Planner adapter:** turns an objective into a bounded, structured plan.
- **Supervisor/kernel:** enforces step limits, tool allowlists, risk labels, approvals and state transitions.
- **Worker adapter:** executes one approved, allowlisted step.
- **Critic/reviewer adapter:** independently evaluates the completed results.
- **State store adapter:** persists task state and the append-only event history.

The kernel is provider-neutral. A future adapter can call LangGraph, Claude, OpenAI, MCP tools or internal services without granting the model direct execution authority.

## Current guarantees in this foundation

- Duplicate requests with the same idempotency key return the stored task instead of starting a second run.
- Tools must be explicitly allowlisted.
- Any step above low risk pauses until an injected server-side approval verifier validates a token bound to the task, step, actor and tool scope. The kernel does not trust raw approval claims supplied by a client.
- Worker retries are bounded (two retries after the first attempt).
- Reviewer failure prevents a task from being marked complete.
- The workflow records ordered lifecycle events.
- External-risk steps are blocked outright in this v1. No external mutation is performed by the kernel itself.

## Important limitations

- `createInMemoryTaskStore()` is for tests and local demonstrations only. It loses state on process restart and is **not** suitable for production.
- A production store must implement atomic idempotency-key reservation, durable task writes and append-only event persistence (for example PostgreSQL with unique constraints and transactions).
- Tool adapters must enforce the supplied idempotency key at the external system. A process crash after an external side effect but before recording its result can otherwise cause duplicate effects on retry.
- This foundation does not yet implement distributed leases, worker heartbeats, dead-letter queues, replay, backpressure, multi-region failover, enterprise integrations or production SLOs.
- Approval tokens must be created and verified by an authenticated server-side approval service injected as `approvalVerifier.verify()`. The client may submit a token, but the kernel never trusts raw approval claims or a client-provided actor/scope object.
- Model outputs and tool results are untrusted data. Adapters must validate schemas and treat retrieved content as data, not instructions.

## Run tests

```bash
node --test src/agent/autonomous-ops/workflow.test.js
```

The repository CI also runs `npm run check` on pull requests to `main`.

## Next production milestones

1. Implement a PostgreSQL-backed store with atomic idempotency and append-only events.
2. Add durable scheduling/leases and recovery using Temporal or a comparable workflow engine.
3. Add authenticated approval endpoints and policy-based tool capabilities.
4. Add provider adapters and structured output validation.
5. Add OpenTelemetry traces, metrics, cost budgets and SLO dashboards.
6. Add security tests for prompt injection, tool abuse, replay and memory poisoning.
7. Demonstrate at least two real enterprise integrations and verify them in a controlled environment.

## Evidence boundary

This v1 is an orchestration foundation with automated tests. It must not be described as an operated production system until durable infrastructure, deployment, security review, reliability targets and live operational evidence exist.
