create table if not exists public.mercysoul_governance_policies (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null,
  version text not null,
  status text not null check (status in ('draft','active','retired')),
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (policy_key, version)
);

create table if not exists public.mercysoul_governance_decisions (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  actor text not null,
  action text not null,
  scope text,
  evidence jsonb not null default '[]'::jsonb,
  decision text not null check (decision in ('ALLOW','REVIEW','DENY')),
  reason text not null,
  risk_level text not null check (risk_level in ('LOW','MEDIUM','HIGH','CRITICAL')),
  policy_key text not null,
  policy_version text not null,
  requires_approval boolean not null default false,
  execution_status text not null default 'not_started'
    check (execution_status in ('not_started','approved','executed','verified','recovery','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mercysoul_governance_approvals (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.mercysoul_governance_decisions(id) on delete cascade,
  approver text not null,
  approved boolean not null,
  evidence jsonb not null default '{}'::jsonb,
  approved_at timestamptz not null default now()
);

create table if not exists public.mercysoul_governance_verifications (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.mercysoul_governance_decisions(id) on delete cascade,
  phase text not null check (phase in ('pre_execution','post_execution','recovery')),
  result text not null check (result in ('PASS','FAIL','REVIEW')),
  evidence jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now()
);

create table if not exists public.mercysoul_governance_audit_events (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references public.mercysoul_governance_decisions(id) on delete set null,
  request_id text,
  event_type text not null,
  actor text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mercysoul_governance_recovery_events (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references public.mercysoul_governance_decisions(id) on delete set null,
  action text not null,
  reason text not null,
  evidence jsonb not null default '{}'::jsonb,
  actor text,
  created_at timestamptz not null default now()
);

alter table public.mercysoul_governance_policies enable row level security;
alter table public.mercysoul_governance_decisions enable row level security;
alter table public.mercysoul_governance_approvals enable row level security;
alter table public.mercysoul_governance_verifications enable row level security;
alter table public.mercysoul_governance_audit_events enable row level security;
alter table public.mercysoul_governance_recovery_events enable row level security;

revoke all on public.mercysoul_governance_policies from anon, authenticated;
revoke all on public.mercysoul_governance_decisions from anon, authenticated;
revoke all on public.mercysoul_governance_approvals from anon, authenticated;
revoke all on public.mercysoul_governance_verifications from anon, authenticated;
revoke all on public.mercysoul_governance_audit_events from anon, authenticated;
revoke all on public.mercysoul_governance_recovery_events from anon, authenticated;

grant all on public.mercysoul_governance_policies to service_role;
grant all on public.mercysoul_governance_decisions to service_role;
grant all on public.mercysoul_governance_approvals to service_role;
grant all on public.mercysoul_governance_verifications to service_role;
grant all on public.mercysoul_governance_audit_events to service_role;
grant all on public.mercysoul_governance_recovery_events to service_role;

create index if not exists idx_ms_gov_decisions_request_id on public.mercysoul_governance_decisions(request_id);
create index if not exists idx_ms_gov_decisions_created_at on public.mercysoul_governance_decisions(created_at desc);
create index if not exists idx_ms_gov_audit_request_id on public.mercysoul_governance_audit_events(request_id);
create index if not exists idx_ms_gov_audit_created_at on public.mercysoul_governance_audit_events(created_at desc);
create index if not exists idx_ms_gov_approvals_decision_id on public.mercysoul_governance_approvals(decision_id);
create index if not exists idx_ms_gov_verifications_decision_id on public.mercysoul_governance_verifications(decision_id);

insert into public.mercysoul_governance_policies (policy_key, version, status, rules, activated_at)
values (
  'algorithm-governance',
  '1.0.0',
  'active',
  jsonb_build_object(
    'command', 'ILLUMINATE → VERIFY → PROTECT → ACT LAWFULLY → VERIFY → RECORD',
    'noVerifiedEvidence', 'no consequential execution',
    'approval', 'required for consequential external mutations',
    'postActionVerification', true,
    'recoveryOnFailure', true,
    'leastIntrusiveAction', true
  ),
  now()
)
on conflict (policy_key, version) do update
set status = excluded.status,
    rules = excluded.rules,
    activated_at = excluded.activated_at;