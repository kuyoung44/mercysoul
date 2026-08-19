-- MercySoul OS persistent data layer (Supabase/Postgres)
create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists visions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  raw_idea text not null,
  status text not null default 'verified',
  approval text not null default 'automatic',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  vision_id uuid references visions(id) on delete set null,
  package text,
  amount numeric(14,2),
  currency text not null default 'NGN',
  status text not null default 'pending_payment',
  approval text not null default 'automatic',
  payment_reference text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists artworks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  status text not null default 'queued',
  prompt text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  entity_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists visions_customer_idx on visions(customer_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists artworks_order_idx on artworks(order_id);
create index if not exists events_created_idx on events(created_at desc);
