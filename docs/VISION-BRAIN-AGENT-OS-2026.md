# MercySoul Vision Brain Agent OS — 2026

## Purpose

Extend the existing MercySoul OS rather than create a parallel platform. The existing
LangGraph workflow, Vision Brain service, Dominion governance engine, orchestration API,
and Supabase audit structures remain the system of record.

## Operating model

`RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD`

The specialist agent registry is descriptive and proposal-only. It does not provide
credentials, bypass policy, or execute tools. The Guardian remains independent from
the specialist proposing work.

## Specialist agents

| Agent | Responsibility | Safe registered capabilities |
|---|---|---|
| Vision | Creative briefs and concepts | `brief.create`, `art.plan`, `content.draft` |
| Builder | Software and deployment preparation | `code.inspect`, `code.propose`, `code.test_plan`, `deployment.propose` |
| Business | Offers and client workflows | `business.analyze`, `proposal.draft`, `lead.organize` |
| Research | Evidence and synthesis | `research.search`, `research.summarize`, `research.compare` |
| Marketing | Campaign preparation | `campaign.plan`, `social.draft`, `analytics.review` |
| Guardian | Policy and audit | `policy.evaluate`, `approval.inspect`, `audit.record` |

Capability names are allowlisted. Unregistered or explicitly denied capabilities fail closed.

## System layers

1. **Model gateway:** Keep provider credentials server-side. Route model calls through the
   configured provider adapter; record model, latency, token/cost metadata where available.
2. **Agent orchestration:** Reuse LangGraph for routing and state transitions. Keep each
   agent's input/output schema narrow and versioned.
3. **Context and MCP:** Register tools with explicit read/write scopes. Treat tool output
   and retrieved documents as untrusted data, never as executable instructions.
4. **Memory:** Separate user-approved durable preferences, project facts, conversation
   summaries, and ephemeral run state. Provide provenance, retention, and deletion paths.
5. **Durable workflows:** Persist workflow state, retries, idempotency keys, timeouts, and
   recovery checkpoints. Do not retry irreversible actions automatically.
6. **Governance:** Every mutation proposal is bound to actor, capability, exact scope,
   request ID, policy version, and expiry. Approvals are one-time and cannot be reused
   for a different action or target.
7. **Observability:** Record request ID, agent ID, tool name, decision, approval evidence,
   execution result, and verification. Redact credentials and personal data from logs.

## Execution policy

- Default: `externalMutation=false`.
- No agent may approve its own proposal.
- Publishing, sending messages, purchases, payments, billing changes, deletions,
  production deployments, and permission changes require explicit human approval.
- Approval is necessary but not sufficient: the executor must re-check identity,
  connector permissions, current target state, policy, and idempotency.
- A proposal or approval check is not evidence that execution happened.
- Report proposed, approved, executed, and verified as distinct states.
- Stop on stale state, missing evidence, permission mismatch, or ambiguous scope.

## Existing infrastructure findings

The inspected repository already includes LangGraph, AI SDK 6, Vision Brain async
function-calling, Dominion governance routes, and Supabase persistence structures.
This implementation adds a small typed-by-convention agent registry without replacing
those systems.

## Security remediation required before production rollout

The inspected Supabase project reported RLS disabled on:
- `public.frontier_workflows`
- `public.frontier_events`
- `public.frontier_tool_calls`

Do not enable RLS blindly: first design and test least-privilege policies for each
table and service role, then apply in a reviewed migration. The registry does not
remediate this database finding.

## Rollout sequence

1. Review the feature branch and run the repository's full test/check scripts.
2. Wire registry lookup into the existing orchestrator behind a feature flag.
3. Add per-tool schemas, allowlists, rate limits, and owner-bound approval records.
4. Validate RLS policies in a staging project and test anonymous/authenticated access.
5. Run dry-run end-to-end tests with external connectors disabled.
6. Obtain explicit approval before merging to main, configuring secrets, or deploying.
7. Enable one read-only integration at a time; only later enable individually approved
   write capabilities.

## Non-goals

This branch does not publish social posts, send email, spend money, deploy production,
change billing, alter Supabase policies, or expose secrets.
