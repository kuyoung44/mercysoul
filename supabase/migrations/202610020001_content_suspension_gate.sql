create table if not exists public.mercysoul_content_suspensions (
  review_id text primary key,
  fingerprint text not null unique,
  account_id text,
  status text not null check (status in ('suspended_pending_evidence','released')),
  decision text not null check (decision in ('pending','confirmed_safe')),
  evidence jsonb not null default '{}'::jsonb,
  release_evidence jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists mercysoul_content_suspensions_account_idx
  on public.mercysoul_content_suspensions(account_id);

create index if not exists mercysoul_content_suspensions_status_idx
  on public.mercysoul_content_suspensions(status, decision);

alter table public.mercysoul_content_suspensions enable row level security;

comment on table public.mercysoul_content_suspensions is
  'MercySoul quarantine state for suspicious links/images. Suspension is preventive, not a finding of guilt. Release requires evidence and authorized confirmation.';
