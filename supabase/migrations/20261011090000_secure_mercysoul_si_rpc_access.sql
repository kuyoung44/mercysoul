-- MercySoul SI: restrict workflow internals and privileged task RPCs.
-- Safe-scope migration: does not alter function business logic or existing data.
-- Apply to a reviewed staging project first; verify app callers before production rollout.

begin;

-- These tables contain internal workflow state, event evidence, and tool-call metadata.
-- RLS is defense-in-depth; direct client privileges are removed because no public
-- or authenticated-client access contract has been verified for these internal tables.
alter table public.frontier_workflows enable row level security;
alter table public.frontier_events enable row level security;
alter table public.frontier_tool_calls enable row level security;

revoke all privileges on table
  public.frontier_workflows,
  public.frontier_events,
  public.frontier_tool_calls
from public, anon, authenticated;

-- Task creation, approval, execution, and verification are privileged server operations.
-- In particular, p_actor is a caller-supplied string, not proof of identity.
-- Keep the existing RPC signatures and logic, but limit invocation to trusted server code.
revoke execute on function public.ms_create_task(text, text, jsonb)
  from public, anon, authenticated;
revoke execute on function public.ms_approve_task(uuid, text)
  from public, anon, authenticated;
revoke execute on function public.ms_execute_task(uuid, text)
  from public, anon, authenticated;
revoke execute on function public.ms_record_verification(uuid, text, jsonb)
  from public, anon, authenticated;

grant execute on function public.ms_create_task(text, text, jsonb) to service_role;
grant execute on function public.ms_approve_task(uuid, text) to service_role;
grant execute on function public.ms_execute_task(uuid, text) to service_role;
grant execute on function public.ms_record_verification(uuid, text, jsonb) to service_role;

-- Harden name resolution for SECURITY DEFINER functions. Keep the public schema
-- available for the existing, unqualified table references in these function bodies.
alter function public.ms_create_task(text, text, jsonb)
  set search_path = pg_catalog, public, pg_temp;
alter function public.ms_approve_task(uuid, text)
  set search_path = pg_catalog, public, pg_temp;
alter function public.ms_execute_task(uuid, text)
  set search_path = pg_catalog, public, pg_temp;
alter function public.ms_record_verification(uuid, text, jsonb)
  set search_path = pg_catalog, public, pg_temp;

commit;
