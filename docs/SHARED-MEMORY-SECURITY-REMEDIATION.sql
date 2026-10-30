-- REVIEW-ONLY SQL: do not run until the owner approves the database change.
-- Target: MercySoul-os (PostgreSQL 17). This creates a new owner-scoped memory
-- table; it deliberately does NOT alter legacy44_memory or ms_memory.
--
-- Important discovery (2026-10-30): public.ms_memory currently has a
-- SELECT policy for PUBLIC with USING (true), and both memory tables have
-- broad API-role grants. It currently contains zero rows, but must not be
-- used for private/shared agent memory until that policy is reviewed.
--
-- New table: authenticated owners can manage only their own memories.
-- Agents use the caller's authenticated user context; do not use a
-- service_role client for normal retrieval because it bypasses RLS.
-- The application must additionally enforce allowed_agents on every read.

create table if not exists public.ms_agent_memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  memory_type text not null check (memory_type in (
    'decision', 'preference', 'project_fact', 'task', 'lesson', 'summary'
  )),
  content text not null check (char_length(content) between 1 and 4000),
  summary text,
  tags text[] not null default '{}',
  source text not null default 'user-provided',
  consent_status text not null default 'pending'
    check (consent_status in ('pending', 'approved', 'revoked')),
  visibility text not null default 'shared'
    check (visibility in ('shared', 'private')),
  allowed_agents text[] not null default '{}'
    check (allowed_agents <@ array['vision','builder','business','research','marketing','guardian']::text[]),
  retention text not null default 'durable'
    check (retention in ('session', 'durable')),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ms_agent_memories_owner_project_created_idx
  on public.ms_agent_memories (owner_id, project_id, created_at desc);

create index if not exists ms_agent_memories_owner_type_idx
  on public.ms_agent_memories (owner_id, memory_type);

alter table public.ms_agent_memories enable row level security;

-- October 30, 2026 Data API default: explicitly grant only what is required.
-- No privileges are granted to anon or PUBLIC.
grant select, insert, update, delete on public.ms_agent_memories to authenticated;
grant all on public.ms_agent_memories to service_role;

create policy "ms_agent_memories_owner_select"
  on public.ms_agent_memories for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "ms_agent_memories_owner_insert"
  on public.ms_agent_memories for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "ms_agent_memories_owner_update"
  on public.ms_agent_memories for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "ms_agent_memories_owner_delete"
  on public.ms_agent_memories for delete to authenticated
  using ((select auth.uid()) = owner_id);

comment on table public.ms_agent_memories is
  'Consent-gated MercySoul agent memory. Agent access must also enforce allowed_agents in the authenticated server workflow.';
