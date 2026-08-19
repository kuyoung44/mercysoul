-- Apply to an existing MercySoul Supabase project.
-- This migration aligns persistence columns with VIS-/ORD-/ART- application IDs.
alter table if exists visions alter column id type text using id::text;
alter table if exists orders alter column id type text using id::text;
alter table if exists orders alter column vision_id type text using vision_id::text;
alter table if exists artworks alter column id type text using id::text;
alter table if exists artworks alter column order_id type text using order_id::text;
alter table if exists artworks add column if not exists vision_id text;
alter table if exists artworks add column if not exists provider text;
alter table if exists events alter column entity_id type text using entity_id::text;
