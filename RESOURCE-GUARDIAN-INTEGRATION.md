# MercySoul Resource Guardian — staged integration package

Target base: `feat/44ms16-guardian-sanctuary`
Working branch: `feat/resource-guardian-efficiency-v1`

## Included
- `src/resource-guardian/guardian.js`: deterministic dispatch, model allowlisting, token budget preflight, opt-in ephemeral cache, per-process usage accounting, audit callback, and human-approval pause.
- `test/guardian.test.js`: isolated Node.js policy tests.

## Integration boundary (intentionally not wired into production request routes)
Repository inspection found that `src/ai/mercy-soul-ai.js` is called from an `/api/ai/chat` route that currently passes a request ID but no verified Supabase user identity. The adjacent `api/chat.js` public concierge route also has no authenticated owner context. Wiring owner-scoped budget enforcement or cache into either route using a caller-supplied user ID would be unsafe.

Before route integration:
1. Add and verify server-side authentication middleware and derive owner ID only from a validated session.
2. Add durable, atomic per-owner daily usage reservations/counters. The included Map-based counter is process-local and cannot enforce budgets across Vercel instances.
3. Add explicit model allowlisting from deployed configuration; no guessed aliases or silent escalation.
4. Decide whether cached results are permitted for each endpoint. Default remains cache-off.
5. Add a server-only audit adapter that records aggregate usage metadata without prompts, completions, secrets, or raw private content.
6. Add a dedicated migration only after reconciling existing migration sources, table ownership, RLS, grants and default privileges.

## Safety
- No request-body owner identity is trusted.
- No credentials or provider calls are embedded in this module.
- Private/secret-bearing prompts are not cache eligible.
- Cache is opt-in, bounded, ephemeral, and owner/project/model/system-version scoped.
- Consequential external actions pause and return approval-required; this module never executes them.
- Currency cost is not claimed without a versioned provider pricing adapter.

## Validation
Run `node --test test/guardian.test.js` in the repository. These tests validate the isolated policy module only, not the deployed service.

## Rollback
Delete the two added files. No database migration, environment change, production route modification, or deployment is included in this staged change.
