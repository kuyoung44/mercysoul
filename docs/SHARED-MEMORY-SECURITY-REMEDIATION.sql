-- APPLIED on 2026-10-30 to Supabase project MercySoul-os.
-- Migration: secure_shared_mercy_agent_memory
-- This file mirrors the applied migration for repository review.

begin;
drop policy if exists ms_memory_read on public.ms_memory;
revoke all privileges on table public.ms_memory from public, anon, authenticated;
grant all privileges on table public.ms_memory to service_role;

create table public.ms_agent_memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  memory_type text not null check (memory_type in ('decision','preference','project_fact','task','lesson','summary')),
  content text not null check (char_length(content) between 1 and 4000),
  summary text,
  tags text[] not null default '{}',
  source text not null default 'user-provided',
  consent_status text not null default 'pending' check (consent_status in ('pending','approved','revoked')),
  visibility text not null default 'shared' check (visibility in ('shared','private')),
  allowed_agents text[] not null default '{}' check (allowed_agents <@ array['vision','builder','business','research','marketing','guardian']::text[]),
  retention text not null default 'durable' check (retention in ('session','durable')),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ms_agent_memories_expiry_check check (retention <> 'session' or expires_at is not null)
);
create index ms_agent_memories_owner_project_created_idx on public.ms_agent_memories (owner_id,project_id,created_at desc);
create index ms_agent_memories_owner_type_idx on public.ms_agent_memories (owner_id,memory_type);
alter table public.ms_agent_memories enable row level security;
revoke all privileges on table public.ms_agent_memories from public,anon,authenticated;
grant select,insert,update,delete on public.ms_agent_memories to authenticated;
grant all privileges on public.ms_agent_memories to service_role;
create policy ms_agent_memories_owner_select on public.ms_agent_memories for select to authenticated using ((select auth.uid())=owner_id);
create policy ms_agent_memories_owner_insert on public.ms_agent_memories for insert to authenticated with check ((select auth.uid())=owner_id);
create policy ms_agent_memories_owner_update on public.ms_agent_memories for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy ms_agent_memories_owner_delete on public.ms_agent_memories for delete to authenticated using ((select auth.uid())=owner_id);
comment on table public.ms_agent_memories is 'Consent-gated MercySoul agent memory. Authenticated owner RLS applies; server agent workflow must enforce consent_status=approved and allowed_agents on every retrieval.';
commit;
