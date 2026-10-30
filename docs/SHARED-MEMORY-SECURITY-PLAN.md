# Shared Memory Security Plan

## Decision
One owner-scoped memory foundation serves Vision, Builder, Business, Research,
Marketing, and Guardian. Shared records may be retrieved by any explicitly
allowlisted specialist. Private records remain owner-controlled and are
retrievable only by explicitly allowlisted agents.

## Verified current state (2026-10-30)
- Supabase project `MercySoul-os` is active and healthy (PostgreSQL 17).
- Existing `public.ms_memory` has columns `id, namespace, key, value,
  confidence, created_at, updated_at`.
- Its only RLS policy is `ms_memory_read`, applies to `PUBLIC`, command
  SELECT, with predicate `true`. That means the policy does not isolate
  one owner from another.
- `ms_memory` currently has zero rows.
- `legacy44_memory` has RLS enabled but no policies; it has broad API-role
  grants. Do not use it for new agent memory.
- Both legacy memory tables have grants to `anon`, `authenticated`, and
  `service_role`. No changes have been made to either table.
- Supabase's October 30, 2026 Data API change means new public tables need
  explicit grants. The proposed SQL grants only to `authenticated` and
  `service_role`, never `anon` or `PUBLIC`.

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
8. Guardian can audit retrieval and write decisions, but its role does not
   grant permission to execute external actions.
9. Memory is context, never an authorization token or execution approval.

## Rollout safeguards
- Do not insert user memories until the new table and access path are reviewed.
- Do not silently copy rows from `ms_memory` or `legacy44_memory`.
- Review and separately remediate the public SELECT policy on `ms_memory`.
- Review all existing grants and policies before changing either legacy table.
- Apply the proposed SQL only after explicit approval.
- Verify owner isolation, agent allowlists, project isolation, consent revocation,
  and anonymous denial with authenticated and anonymous test sessions.
- Run Supabase security advisors after any approved DDL change.

## Proposed database artifact
See `docs/SHARED-MEMORY-SECURITY-REMEDIATION.sql`. It is review-only and has
not been executed.
