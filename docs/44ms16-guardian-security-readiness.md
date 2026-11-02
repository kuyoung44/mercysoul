# 44MS16 Guardian Sanctuary — Security Readiness Gate

**Assessment date:** 2026-11-02  
**Status:** BLOCKED — do not connect owner data or enable external execution yet.  
**Scope:** Read-only inspection of `feat/44ms16-guardian-sanctuary` and Supabase schema/migration metadata. This document is a review record, not an authorization to deploy or execute.

## Branch and release boundary

- Repository: [kuyoung44/mercysoul](https://github.com/kuyoung44/mercysoul)
- Baseline supplied for the sanctuary frontend: [278910335042b80ec95c14af72477eb818045117](https://github.com/kuyoung44/mercysoul/commit/278910335042b80ec95c14af72477eb818045117)
- Comparison against `feat/44ms16-guardian-sanctuary`: 5 commits ahead, 0 behind; changes reported in `public/planet-44ms16.html`, `server.js`, `src/orchestrator/executor.js`, and `vercel.json`.
- Reviewed branch commit: [88ee0a83aea27b76a6c54b273d88a52c09afde8f](https://github.com/kuyoung44/mercysoul/commit/88ee0a83aea27b76a6c54b273d88a52c09afde8f). Its reported GitHub status contains a successful Vercel check; no test status was reported by the combined-status response.
- No production homepage, production configuration, deployment, database rows, or external system was changed by this assessment.

## Verified findings

### 1. Frontend persistence is local-only

[`public/44ms16.html`](https://github.com/kuyoung44/mercysoul/blob/feat/44ms16-guardian-sanctuary/public/44ms16.html) is a browser-local sanctuary. Its vision/project/proposal/memory interface is not evidence of a server-authenticated owner session or durable, owner-scoped records. Keep it explicitly local-first until the server contract is implemented.

### 2. There is no verified owner session contract in the app

- [`src/orchestrator/guard.js`](https://github.com/kuyoung44/mercysoul/blob/feat/44ms16-guardian-sanctuary/src/orchestrator/guard.js#L3-L10) authorizes with a shared `ADMIN_API_TOKEN`; `execute: true` changes the returned mode to `write-authorized`. A shared bearer secret is not a distinct, auditable human approver identity.
- [`src/google-oauth.js`](https://github.com/kuyoung44/mercysoul/blob/feat/44ms16-guardian-sanctuary/src/google-oauth.js) keeps OAuth state and the connected profile/token in process memory and defaults to a Render callback URL. The callback returns a profile but does not establish a durable, server-verified MercySoul owner session. It must not be reused as owner authentication without a separately verified contract.
- [`server.js`](https://github.com/kuyoung44/mercysoul/blob/feat/44ms16-guardian-sanctuary/server.js#L101-L157) accepts a caller-supplied `owner` value when creating a proposal and accepts caller-supplied `governanceProposal` and `approval` objects on the engine route. Those fields are not proof of a durable human identity or a persisted approval decision.
- [`src/dominion-governance-engine.js`](https://github.com/kuyoung44/mercysoul/blob/feat/44ms16-guardian-sanctuary/src/dominion-governance-engine.js#L69-L99) checks fields on the supplied approval object, but explicitly returns `executionAllowed: false` and describes the result as a handoff requiring separate adapter revalidation. It is not a durable approval-consumption service.
- [`src/command-center/routes.js`](https://github.com/kuyoung44/mercysoul/blob/feat/44ms16-guardian-sanctuary/src/command-center/routes.js) contains a caller-supplied `approved === true` check. It is not imported by the currently inspected `server.js`; do not mount it as an execution route without replacing that check.

### 3. Executor currently fails closed for non-status actions, but the approval contract is incomplete

[`src/orchestrator/executor.js`](https://github.com/kuyoung44/mercysoul/blob/feat/44ms16-guardian-sanctuary/src/orchestrator/executor.js#L10-L19) currently allows only `status` and rejects other actions. Preserve this barrier. The route-level `execute` flag and engine handoff must not be treated as authority to perform a mutation. Unknown actions must be rejected explicitly, not mapped to a default action.

### 4. Supabase schema is not yet a verified Guardian contract

Read-only metadata inspection was performed against project `MercySoul-os` (`clxkaxoobtlmofiugwvf`). No SQL was executed and no table data was changed.

- `frontier_workflows`, `frontier_events`, and `frontier_tool_calls` currently report **RLS disabled**. Do not connect them to owner-facing or public routes in this state.
- `command_center_approvals` has `id, action, command, risk_level, status, requested_at, decided_at, executed_at, decision_note, result, issue_number, commitment`. The inspected columns do not provide a verified approver user ID, canonical target/payload digest, expiry, one-time consumption marker, or task-bound replay key.
- `command_center_audit` has a free-text `actor` and `metadata`; append-only database enforcement and actor authentication were not verified.
- `legacy44_memory` has no `owner_id` column. `ms_tasks.owner` and `ms_audit.actor` are text fields; `ms_memory` has no owner ID column. These cannot be assumed to enforce isolation by authenticated owner.
- Supabase Auth is referenced by existing foreign keys and a `user_roles` table exists, but the app's server-side session validation and the exact founder/owner UUID and role grant were not verified. Existing school-role values in `profiles` are not, by themselves, proof of a MercySoul founder role.
- The database migration ledger records `20261001053329 / create_frontier_control_plane`, but the expected source path `supabase/migrations/20261001053329_create_frontier_control_plane.sql` is absent on the inspected branch. Several other ledger-named migration files also could not be fetched from their expected timestamped paths. Do not invent a replacement or apply a migration until the source/history is reconciled.
- RLS being enabled on a table does not prove its policies or grants are safe. Policies, grants, function ownership, and default privileges were not re-queried because this run was kept free of SQL execution.

## Required contract before implementation can safely continue

1. **Owner identity:** verify the existing Supabase Auth user UUID intended to own 44MS16 and the exact server-side role/allowlist rule. Every request must derive `owner_id` from a validated server session/JWT, never from request JSON or a connected Google profile.
2. **Session lifecycle:** establish server-side validation, expiry/revocation behavior, secure cookie/token handling, and CSRF protection for state-changing browser requests. Keep service-role credentials server-only.
3. **Canonical proposal:** persist an immutable proposal with action identifier, exact target, canonical payload digest, task/resource binding, requester, and creation time.
4. **Human approval:** persist authenticated `approver_id`, decision, reason, proposal digest, and short expiry. The approver must be authorized independently of the requester/session claims.
5. **Atomic one-time consumption:** use a reviewed database transaction/RPC that locks and consumes only an approved, unexpired, unused record whose actor, task, action, target, and payload digest all match. The executor must revalidate immediately before provider mutation; a second or concurrent consume must fail.
6. **Append-only audit:** write durable events through a constrained server/database path; deny application-role update/delete, record authenticated actor and proposal/approval/task references, and verify integrity/recovery behavior.
7. **RLS and grants:** reconcile migration source first, then prepare owner-scoped policies and least-privilege grants for all new and reused tables. Do not execute the migration against production without separate authorization.

## Regression tests required before any release

- Unauthenticated and expired-session requests are denied.
- Client-supplied owner, approver, role, or `approved: true` cannot authorize anything.
- Forged, altered, wrong-target, wrong-task, wrong-payload, wrong-actor, and expired approvals are denied.
- Approval replay and concurrent double-consumption allow at most one successful consume.
- Unknown actions and unknown providers deny by default.
- Direct executor calls revalidate the durable approval; route checks alone are insufficient.
- RLS cross-owner reads/writes are denied; audit update/delete is denied to application roles.
- Missing identity/session configuration and persistence failures fail closed.
- Export/recovery round-trip is tested without leaking secrets or another owner's records.

## Test and execution evidence for this run

- `package.json` declares `npm test` as `node --test src`; `npm run check` includes syntax checks and the test suite.
- Tests and syntax checks were **not run**: the runtime could not clone the GitHub repository because DNS resolution for `github.com` failed. The available GitHub combined status reported a Vercel success only; it did not report a unit-test check.
- No application code, SQL, environment setting, production data, deployment, or external action was changed.

**Decision:** stop at the security gate. The next safe step is to reconcile the migration source and confirm the canonical owner identity/session contract, then implement the shared durable approval service and denial tests on this feature branch. Until that evidence exists, keep external execution disabled.
