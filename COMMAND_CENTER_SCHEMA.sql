-- MercySoul Command Center durable task state
-- Run once in the MercySoul Supabase project.

create table if not exists public.mercysoul_agent_tasks (
  id text primary key,
  command text not null,
  priority text not null default 'normal' check (priority in ('normal','low')),
  status text not null default 'queued' check (status in ('queued','running','paused','completed','failed','stopped')),
  agents jsonb not null default '[]'::jsonb,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  checkpoint jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resumed_at timestamptz
);

create index if not exists mercysoul_agent_tasks_status_idx on public.mercysoul_agent_tasks(status);
create index if not exists mercysoul_agent_tasks_updated_idx on public.mercysoul_agent_tasks(updated_at desc);

alter table public.mercysoul_agent_tasks enable row level security;

-- The server uses the Supabase service-role key, so no public client policy is required.
-- Keep the service-role key server-side only.
