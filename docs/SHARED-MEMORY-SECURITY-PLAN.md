# Shared Memory Security Plan

## Decision
One owner-scoped memory foundation serves Vision, Builder, Business, Research,
Marketing, and Guardian. Shared records may be retrieved by any explicitly
allowlisted specialist. Private records remain owner-controlled and are
retrievable only by explicitly allowlisted agents.

## Applied database change (2026-10-30)
- Supabase project: MercySoul-os.
- Migration applied: `secure_shared_mercy_agent_memory`.
- Created `public.ms_agent_memories` with authenticated-owner RLS policies for
  SELECT, INSERT, UPDATE, and DELETE.
- New table grants are limited to `authenticated` and `service_role`;
  no `anon` or `PUBLIC` grant.
- Removed the PUBLIC SELECT policy from legacy `public.ms_memory`.
- Revoked API-role privileges from `PUBLIC`, `anon`, and `authenticated`
  on legacy `ms_memory`; retained backend `service_role` access.
- No rows were copied or inserted. Both legacy and new memory tables contain
  zero rows after migration.

## Verified current state
- `ms_memory`: RLS enabled, no policies, no grants to anon/authenticated;
  service_role retains backend access.
- `ms_agent_memories`: RLS enabled; four policies scoped to
  `(select auth.uid()) = owner_id`.
- `ms_agent_memories`: authenticated has CRUD grants, but RLS restricts every
  operation to the authenticated owner. service_role has backend privileges.
- Verified table and policy metadata directly after migration.
- Supabase security advisor still reports unrelated issues:
  1. RLS disabled on `frontier_workflows`, `frontier_events`, and
     `frontier_tool_calls` (critical). They were deliberately not altered
     because their ownership and intended policies need review.
  2. Multiple existing tables have RLS enabled but no policies.
  3. Four SECURITY DEFINER task RPCs remain executable by anon and six
     SECURITY DEFINER functions by authenticated; these need separate review.
- These remaining findings are not evidence that the new memory table is open.

## Access contract
1. Every memory has an authenticated `owner_id`.
2. Every memory write requires explicit consent; pending/revoked memories are
   not eligible for agent retrieval.
3. All six specialists can use shared memories only when their agent ID is
   in `allowed_agents`.
4. Private memories require an explicit per-agent allowlist.
5. A project-bound memory is only available inside that project. A null
   project ID is owner-global.
6. Missing owner, unknown agent, missing consent, or missing scope is deny.
7. Normal agent retrieval must use the owner's authenticated JWT so Postgres
   RLS remains active. Do not use a service-role client for ordinary reads.
8. If a trusted backend service role is used for a narrowly-scoped job, the
   application must independently enforce owner, project, consent and
   allowed_agents filters before returning any memory.
9. Guardian can audit retrieval and write decisions, but its role does not
   grant permission to execute external actions.
10. Memory is context, never an authorization token or execution approval.

## Rollout safeguards
- No agent has been connected to the new table yet.
- Do not insert user memories until the application integration is implemented
  and owner/agent/project/consent tests pass.
- Do not silently copy rows from `ms_memory` or `legacy44_memory`.
- Verify owner isolation, agent allowlists, project isolation, consent
  revocation, expiry and anonymous denial with authenticated test sessions.
- Revisit the remaining Supabase security-advisor findings separately.

## Repository implementation
- `src/agent/memory-policy.js`: opt-in candidate preparation and sensitive
  content exclusion.
- `src/agent/memory-access.js`: fail-closed owner, project and agent access
  filter.
- Unit tests exist for the pure policy functions but have not yet been run in
  this environment.
- Database migration is applied; agent persistence integration is not.
