create table if not exists cloud_audit_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  status text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists cloud_audit_events_created_at_idx on cloud_audit_events(created_at desc);
