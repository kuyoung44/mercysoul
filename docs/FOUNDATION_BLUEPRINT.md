# MercySoul Dominion — Technical Foundation Blueprint

**Track:** 44MS16 Core Foundation  
**Repository:** `kuyoung44/mercysoul`  
**Baseline branch:** `main`  
**Working branch:** `foundation/44ms16-core-baseline`  
**Prepared:** 2026-11-08

## 1. Mission

Build one founder-controlled, modular platform for MercySoul Dominion. MercySoul OS remains the core application and orchestration layer; MercySoul Vision Brain / MSi is the intelligence experience; customer-facing products are modules on top of shared identity, service, persistence, billing, governance, and observability foundations.

The platform must be useful, commercially viable, mobile-first, and honest about what is implemented versus configured, deployed, tested, and independently verified.

## 2. Verified starting point

The following facts were observed from the repository and connected service metadata during this baseline review:

- GitHub repository `kuyoung44/mercysoul` is public, has default branch `main`, and the connected GitHub account has repository admin/push permissions.
- The repository is a JavaScript ES-module Node application. `package.json` declares Node `>=20 <25`, Express, LangGraph, OpenAI, and the Vercel AI SDK.
- The package start script is `node agent-bootstrap.js`; the bootstrap imports the Express server and mounts additional bot, research, messaging, and command-center routes.
- The server includes health/status, governance, moderation, orchestration, and engine routes. The repository contains Node's built-in test-runner tests and GitHub Actions CI configured to run `npm run check`.
- The Vercel project named `mercysoul` is configured as an Express project. A recent deployment record reports `READY`, but its target is not `production`; this is not sufficient evidence that the canonical public domain is serving that exact build.
- The Supabase project `MercySoul-os` is active and healthy on PostgreSQL 17. Its public schema already contains project registry, governance decision/approval/verification/audit/recovery, service profile, and consent-gated agent-memory tables.
- Supabase reported three public tables with RLS disabled: `frontier_workflows`, `frontier_events`, and `frontier_tool_calls`. This is a critical exposure requiring a policy review before remediation.

These are baseline observations, not a complete security audit or proof that every feature is operational.

## 3. Target architecture

```text
MercySoul Dominion
|
+-- Experience layer
|   +-- Dominion public site and founder console
|   +-- Vision Brain / MSi workspace
|   +-- Customer portal and service products
|   +-- Creative studio
|
+-- Application layer
|   +-- Identity, sessions, roles, tenant boundaries
|   +-- Customer, project, order, and service APIs
|   +-- AI gateway and provider adapters
|   +-- Workflow / job orchestration
|   +-- Payments and entitlement checks
|
+-- Intelligence layer
|   +-- Vision / reasoning
|   +-- Builder / code assistance
|   +-- Research
|   +-- Business and marketing
|   +-- Guardian / policy evaluation
|   +-- Human approval and verification
|
+-- Governance control plane
|   +-- Receive -> Route -> Think -> Plan -> Guardian
|   +-- Approve -> Execute -> Verify -> Recover -> Record
|   +-- Scoped approvals, expiry, replay protection
|   +-- Append-only audit evidence
|
+-- Data layer
|   +-- Supabase Auth
|   +-- PostgreSQL with RLS
|   +-- Storage with private-by-default access
|   +-- Durable jobs/events and audit records
|
+-- Delivery and operations
    +-- GitHub source, reviews, CI
    +-- Vercel previews and production
    +-- Health checks, structured logs, alerts
    +-- Backup, recovery, rollback evidence
```

## 4. Non-negotiable engineering invariants

1. **Founder ownership:** repository, deployment, database, domains, billing, and provider accounts remain under founder-controlled accounts. Collaborators receive least-privilege access only.
2. **No approval, no execution:** plans are non-mutating. Writes, publishing, payments, permission changes, database changes, and deployments require explicit, scoped, expiring human approval.
3. **No secret exposure:** service-role keys, provider keys, admin tokens, and webhook secrets are server-only. No secret is committed or placed in a `NEXT_PUBLIC_` variable.
4. **Tenant isolation:** every customer-owned record has an explicit ownership/tenant model and server-side authorization. RLS is defense in depth, not a substitute for application checks.
5. **Safe persistence:** durable writes are idempotent where possible, auditable, and recoverable. No production schema or policy change is performed without a reviewed migration and explicit founder approval.
6. **Truthful capability claims:** distinguish source code, passing tests, configured integrations, successful deployments, and real customer outcomes.
7. **Mobile-first delivery:** interfaces and operator workflows must remain usable on a phone, including the founder's Android device.
8. **No hidden authority:** identity, authentication, authorization, approval, execution, and verification remain separate steps.

## 5. Critical findings to resolve before production expansion

### P0 — Supabase RLS exposure

The live project inspection identified RLS disabled on:

- `public.frontier_workflows`
- `public.frontier_events`
- `public.frontier_tool_calls`

Do not blindly enable RLS: that can break existing service workflows if policies are not designed first. Inspect table columns, current access paths, service-role usage, and intended human/service actors. Prepare a least-privilege policy proposal and test it in a non-production environment. Production SQL, grants, policies, and migrations remain founder-approval-only.

### P0 — Orchestrator approval gate

The current `src/orchestrator/http.js` command route permits the request to proceed past its `requiresApproval` response when `execute: true` is supplied. The current `authorizeOrchestration` guard treats a valid admin bearer token plus `execute: true` as write-authorized. This does not establish a separate scoped human approval record. Until the route is repaired and covered by tests, treat provider write execution through this route as unsafe and keep it disabled.

Required target behavior:

- A plan endpoint may classify actions and return a proposal without side effects.
- A mutation must be bound to a proposal digest, exact action/scope, named approver, approval ID, reason, and expiry.
- The server revalidates the approval and provider permissions immediately before execution.
- Approval cannot be replayed for another action, scope, tenant, or expired request.
- Missing or invalid approval returns a blocked response and records an audit event.
- Read-only actions are explicitly classified; do not infer read-only behavior from vague natural-language phrasing.

### P1 — Runtime and configuration consistency

- `README.md` and `package.json` report different release versions; establish one release source of truth.
- `.env.example` contains an obsolete Render OAuth callback even though the primary hosting target is Vercel. Replace only after the intended OAuth callback is confirmed.
- `config.js` requires several environment variables during module import. Confirm that each deployment target has the required variables and that public pages remain independent of private runtime configuration.
- Verify the exact Git commit, deployment target, aliases, domain, and live health response before describing a deployment as production-live.
- Review the existing in-memory rate-limit and blocklist stores for serverless behavior; process-local state is not durable across instances.

### P1 — Authorization and privacy review

- Review every public API route for authentication, authorization, input validation, rate limits, CORS, and safe error handling.
- Remove wildcard-origin bypasses from any production request-validation path; use explicit trusted origins.
- Ensure customer data, agent memory, orders, payment state, and uploaded assets have owner/tenant checks and retention rules.
- Keep sensitive reads and financial actions separately classified from ordinary reads.

## 6. Build sequence and acceptance gates

### Phase 0 — Baseline and safety (this branch)

- Preserve the current production branch.
- Record repository, deployment, and database baseline.
- Publish this architecture and remediation blueprint.
- No production SQL, RLS, grants, migrations, environment changes, or deployment mutations.

**Exit gate:** architecture and risk register reviewed; production boundaries understood.

### Phase 1 — Secure core

- Repair orchestration approval bypass and add regression tests.
- Create a capability registry with explicit read, sensitive-read, write, financial-write, and privileged-write action classes.
- Add scoped approval records with expiry, one-time consumption, and immutable audit references.
- Add request IDs, structured logs, and safe error envelopes.
- Add tests for missing token, wrong token, missing approval, scope mismatch, expiry, replay, and success.

**Exit gate:** all tests pass; no mutation path executes from an admin token alone.

### Phase 2 — Identity and data foundation

- Document user, organization/tenant, membership, role, project, customer, order, job, and audit entities.
- Review all existing tables and RLS policies; identify the three RLS-disabled Frontier tables.
- Design policies for owner, tenant admin, service worker, and public access where applicable.
- Test policy behavior with separate anonymous, authenticated, tenant-owner, and service-role contexts.
- Produce migrations for review; do not apply to production until approved.

**Exit gate:** tenant-isolation tests pass and every exposed table has an approved access model.

### Phase 3 — Product and service APIs

- Customer accounts and profile.
- Project/workspace management.
- Service catalog, quotes, orders, and entitlements.
- Secure file upload and delivery.
- Payment initiation, signed webhook verification, idempotent fulfillment, and refunds behind approval.
- Notifications and customer support.

**Exit gate:** end-to-end test purchase and fulfillment in sandbox mode; no unverified payment can unlock a paid service.

### Phase 4 — Vision Brain / MSi

- Provider abstraction and model configuration.
- Conversation and task orchestration.
- Consent-gated memory retrieval.
- Tool registry and least-privilege tool adapters.
- Human review for consequential operations.
- Usage limits, token/cost tracking, fallbacks, and model-unavailable states.

**Exit gate:** prompts cannot bypass server authorization; model output alone never executes a mutation.

### Phase 5 — Founder console and customer experience

- Mobile-first founder dashboard.
- Service and project management.
- Approval queue and audit viewer.
- Usage, cost, and reliability overview.
- Customer portal and creative studio.
- Accessible, responsive UI with clear empty, loading, error, and success states.

**Exit gate:** phone usability verified; privileged controls require fresh authentication and scoped authorization.

### Phase 6 — Delivery and operations

- Pull-request checks, dependency/security checks, and reproducible builds.
- Preview deployments for branches; production deploy only after founder approval.
- Health, readiness, and dependency status checks.
- Backup/restore drill and rollback procedure.
- Incident response runbook and release evidence.

**Exit gate:** production release tied to a reviewed commit, passing CI, verified environment configuration, and successful smoke tests.

## 7. Release evidence standard

A capability may be labelled:

- **Designed** — architecture/specification exists.
- **Implemented** — source code exists.
- **Tested** — named automated/manual test passed with evidence.
- **Configured** — required provider credentials/settings exist (without exposing them).
- **Deployed** — a specific deployment is ready and tied to a commit.
- **Production-verified** — live smoke tests and operational checks passed.
- **Customer-validated** — real use and outcome evidence exists.

Never collapse these states into a single "complete" claim.

## 8. Immediate next engineering task

Start Phase 1 with the orchestrator approval gate. Build a regression test that proves a valid admin token and `execute: true` cannot trigger a provider mutation without a matching, unexpired, one-time scoped approval. Then review the Supabase Frontier RLS design separately and prepare a non-production policy test plan.

**Operating sequence:** RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD.

**MercySoul Dominion:** build useful systems, protect people and data, preserve founder control, and prove every consequential claim.
