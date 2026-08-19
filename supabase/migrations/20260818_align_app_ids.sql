-- Keep MercySoul application IDs compatible with API identifiers such as VIS-* and ORD-*.
-- Run once against an existing Supabase project before enabling production persistence.
alter table if exists visions alter column id type text using id::text;
alter table if exists orders alter column id type text using id::text;
alter table if exists artworks alter column id type text using id::text;
alter table if exists events alter column id type text using id::text;
alter table if exists customers alter column id type text using id::text;

alter table if exists visions alter column customer_id type text using customer_id::text;
alter table if exists orders alter column customer_id type text using customer_id::text;
alter table if exists orders alter column vision_id type text using vision_id::text;
alter table if exists artworks alter column order_id type text using order_id::text;
alter table if exists events alter column entity_id type text using entity_id::text;

alter table if exists visions alter column id set default gen_random_uuid()::text;
alter table if exists orders alter column id set default gen_random_uuid()::text;
alter table if exists artworks alter column id set default gen_random_uuid()::text;
alter table if exists events alter column id set default gen_random_uuid()::text;
alter table if exists customers alter column id set default gen_random_uuid()::text;
