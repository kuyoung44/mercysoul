# MercySoul Dominion — Architecture & Security Audit
**Date:** 2026-11-27  
**Repository:** https://github.com/kuyoung44/mercysoul  
**Audited ref:** `main` at `2ac9797da220762318ece6db9f2a9fbd6eb82204`  
**Audit branch:** `audit/vision-brain-architecture-2026-11-27`  
**Scope:** Read-only source/configuration inspection. No production calls, database writes, merges, or deployments were performed.

## Executive summary

MercySoul has a substantial Node.js/ESM codebase with API routes, a model router, a Vision Brain async tool loop, LangGraph orchestration, action-boundary helpers, provider adapters, Supabase persistence, and GitHub Actions workflows.

The codebase is a credible foundation for a governed AI product, but the inspected source reveals execution-entry-point authorization gaps that should be closed before enabling broader agent execution. The existence of a governance module or a protected endpoint does not prove every route is protected.

**Overall assessment:** Promising engineering foundation; not yet independently verified as production-safe. Prioritize authorization consistency, then build Vision Brain capabilities behind the corrected boundaries.

## Repository and runtime facts

- Default branch: `main`; repository is public.
- Package: `mercysoul-os`, version `5.0.0`.
- Node engine: `>=22 <25`.
- Main stack includes Express, LangGraph, OpenAI SDK, and Vercel AI SDK.
- Test command: `node --test $(find src -type f -name "*.test.js" -print)`.
- `npm run check` performs selected syntax checks and runs the test suite.
- Existing workflows include CI, security hardening, deployment gating, and control-plane verification.
- Current main commit is a merge of PR #101, “Add MercySoul Vision Brain universal project foundation”.

## Findings

### F-01 — OS execution API has no visible authentication gate
**Severity: Critical**  
**Evidence:** `server.js` registers `POST /api/os/execute` and directly calls `executeOperatingSystem(req.body || {})`. The route does not call `requireAdminToken` or another visible authorization guard.  
**Impact:** The `command_center` action path in `src/mercyos-operating-system.js` exposes task creation, progress updates, and task controls through this route. Depending on deployment exposure, unauthenticated callers may create or alter orchestration tasks.  
**Recommendation:** Require server-side authentication on this route. Separate read-only status from state-changing task actions. Require scoped, explicit approval for consequential controls. Add negative tests for missing, invalid, and valid credentials.

### F-02 — SmartThings device command lacks user/session authorization
**Severity: Critical**  
**Evidence:** `POST /api/smartthings/devices/:deviceId/command` checks whether an in-memory SmartThings access token exists, then calls `sendSmartThingsCommand`; no requester identity/session or ownership check is visible in the route.  
**Impact:** If a SmartThings account has been connected to the running service, a caller able to reach this endpoint may be able to issue device commands. OAuth connection state is not equivalent to authorization of every later requester.  
**Recommendation:** Require authenticated owner sessions, bind the OAuth connection to the owner, verify device ownership and command allowlists, and add CSRF/replay protection where cookie sessions are used. Test denial for unauthenticated and non-owner requests.

### F-03 — Supabase test endpoint accepts public event writes
**Severity: High**  
**Evidence:** `POST /api/supabase/test` calls `persistEventBestEffort` with a caller-supplied message and has no visible authentication or strict request schema at the route.  
**Impact:** Can create avoidable database write volume and untrusted audit/event records.  
**Recommendation:** Restrict to authenticated diagnostics or remove from production; validate and cap payload size; apply rate limits; tag diagnostic events distinctly; avoid storing arbitrary user-controlled content.

### F-04 — Orchestrator task controls do not enforce the guard's returned mode
**Severity: High**  
**Evidence:** `src/orchestrator/http.js` calls `authorizeOrchestration(req, { allowWrite: true })` for `POST /orchestrator/tasks/:id/control`, but then invokes `controlCommandTask` without checking `auth.mode` or requiring a request-level `execute: true` confirmation. The guard returns `plan-only` when execute is absent.  
**Impact:** The route's behavior does not match the guard's advertised plan-only/write-authorized distinction. The admin bearer token is still required, but the additional explicit execution boundary is not consistently applied.  
**Recommendation:** Enforce the guard result, require an explicit action-specific approval for pause/resume/stop/checkpoint, and record approver, task, action, scope, expiry, and outcome.

### F-05 — Generic action-boundary confirmation is not a complete authorization protocol
**Severity: High**  
**Evidence:** `src/action-boundary.js` accepts the literal string `CONFIRM` after checking a caller-supplied `authorized` boolean. It does not bind the confirmation to a proposal digest, actor identity, scope, or expiry.  
**Impact:** The helper is useful as a local decision utility but should not be the sole control for consequential operations.  
**Recommendation:** Use the existing Dominion Governance Engine's proposal digest and scoped approval structure consistently at all mutation-capable entry points. Re-check permissions and provider state at execution time.

### F-06 — Vision Brain async capability is currently narrow
**Severity: Medium**  
**Evidence:** `src/vision-brain/async-agent.js` exposes one function tool, `get_mercy_soul_status`, and continues the Responses API turn with its result.  
**Impact:** This demonstrates a server-managed tool-call pattern, but does not yet establish a general reasoning/planning engine, durable memory, safe multi-tool execution, or autonomous task completion.  
**Recommendation:** Extend in stages: structured reasoning output, task planner, read-only tools, evidence collection, Guardian review, approval proposal, then isolated execution adapters. Keep all consequential tools disabled until the authorization findings are resolved.

### F-07 — Model router selects profiles but does not execute or automatically fail over
**Severity: Medium**  
**Evidence:** `src/ai/model-router.js` explicitly documents that it selects identifiers only; `automaticFallback: false` and `providerCalls: 0`.  
**Impact:** Do not describe this module alone as multi-provider execution or automatic resilience.  
**Recommendation:** Integrate with a server-side provider adapter layer, add timeout/error policy and explicit fallback tests, and report actual configured/healthy providers separately from selected model IDs.

### F-08 — Supabase schema files have different RLS posture
**Severity: High**  
**Evidence:** Root `SUPABASE_SCHEMA.sql` explicitly enables RLS on `mercysoul_events` and `mercysoul_kyc_verifications`. The inspected `supabase/schema.sql` creates `customers`, `visions`, `orders`, `artworks`, and `events` but does not show corresponding `ENABLE ROW LEVEL SECURITY` statements.  
**Impact:** Applying or relying on different schema entry points can result in inconsistent exposure. Existing deployment state cannot be inferred from these files alone.  
**Recommendation:** Reconcile canonical schema and migrations. Verify live table RLS and policies in read-only mode before proposing SQL changes. Do not apply migrations or change grants without founder approval.

## Positive controls already present

- `src/dominion-governance-engine.js` validates proposal integrity, exact scope, approver identity, approval reference, and expiry; it intentionally does not execute actions.
- `POST /api/engine/run` checks an admin token and requires a matching proposal plus explicit scoped approval for execution.
- `src/engine/shutdown-gate.js` provides a configuration-driven fail-closed execution stop.
- `src/ai/mercy-soul-ai.js` declares that the model cannot independently authorize consequential actions.
- `src/ai/model-router.js` keeps provider calls and execution authority outside the selection module.
- CI and security-hardening workflows exist, with dependency, secret, and repository checks.

## Recommended remediation order

1. Protect `/api/os/execute` and split status/read operations from mutations.
2. Protect SmartThings command execution with authenticated owner identity and device-level authorization.
3. Restrict `/api/supabase/test` and enforce diagnostic payload limits.
4. Make every orchestrator mutation enforce the returned authorization mode and scoped approval.
5. Reconcile Supabase schema/migration RLS policy and verify live configuration read-only.
6. Add route-level security tests and regression tests for every denied execution path.
7. Only then expand Vision Brain's read-only planning and tool registry.

## Verification limitations

- This audit used GitHub repository metadata and source-file reads.
- No local dependency installation, Node test run, integration test, or deployment health check was executed in this audit.
- No live Supabase schema, RLS policy, Vercel environment variable, or provider credential was inspected.
- No secret values were requested or copied.
- Findings are source-level observations; deployment routing, upstream firewall rules, and platform-level protections may add controls not visible in the inspected route code.
- No production SQL, external provider action, deployment, merge, or public communication was performed.

## Definition of done for the next implementation pass

- Every mutating API route has an explicit authentication and authorization test.
- Missing/invalid credentials are denied.
- Approval is bound to a proposal, actor, target, action, scope, and expiry.
- Provider adapters re-check authorization before performing mutations.
- Read-only status and planning endpoints remain available without granting execution rights.
- Tests pass on an isolated branch.
- Founder review occurs before merge or deployment.
