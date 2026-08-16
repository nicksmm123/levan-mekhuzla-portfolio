-- ============================================================
-- Levan Mekhuzla Portfolio — Supabase Setup
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Artworks table
--    Only image_url is required; all metadata columns are nullable.
create table if not exists artworks (
  id           uuid         default gen_random_uuid() primary key,
  image_url    text         not null default '',
  title_en     text,
  title_ka     text,
  year         integer,
  medium_en    text,
  medium_ka    text,
  dimensions   text,
  category     text         check (category is null or category in ('original-paintings','limited-edition-prints','graphic-works')),
  status       text         check (status  is null or status  in ('available','private-collection')),
  price        numeric(10,2),
  sort_order   integer,
  created_at   timestamptz  default now() not null
);

-- ============================================================
-- If the table already exists (from a previous run of this script),
-- run the block below to relax the NOT NULL constraints on metadata
-- columns. Skip this block on a fresh install.
-- ============================================================
-- alter table artworks
--   alter column title_en  drop not null,
--   alter column title_ka  drop not null,
--   alter column year      drop not null,
--   alter column medium_en drop not null,
--   alter column medium_ka drop not null,
--   alter column dimensions drop not null,
--   alter column sort_order drop not null;
--
-- alter table artworks
--   drop constraint if exists artworks_category_check,
--   add  constraint artworks_category_check
--     check (category is null or category in ('original-paintings','limited-edition-prints','graphic-works'));
--
-- alter table artworks
--   drop constraint if exists artworks_status_check,
--   add  constraint artworks_status_check
--     check (status is null or status in ('available','private-collection'));
-- ============================================================

-- 2. Row-Level Security
alter table artworks enable row level security;

-- Anyone can read artworks (public gallery)
create policy "Public can read artworks"
  on artworks for select
  using (true);

-- Only authenticated users (the admin) can insert
create policy "Authenticated users can insert artworks"
  on artworks for insert
  with check (auth.uid() is not null);

-- Only authenticated users can update
create policy "Authenticated users can update artworks"
  on artworks for update
  using (auth.uid() is not null);

-- Only authenticated users can delete
create policy "Authenticated users can delete artworks"
  on artworks for delete
  using (auth.uid() is not null);

-- 3. Storage bucket for artwork images
insert into storage.buckets (id, name, public)
values ('artwork-images', 'artwork-images', true)
on conflict (id) do nothing;

-- Anyone can view images (public URLs served directly by Supabase CDN)
create policy "Public can view artwork images"
  on storage.objects for select
  using (bucket_id = 'artwork-images');

-- Only authenticated users can upload
create policy "Authenticated users can upload artwork images"
  on storage.objects for insert
  with check (bucket_id = 'artwork-images' and auth.uid() is not null);

-- Only authenticated users can delete images
create policy "Authenticated users can delete artwork images"
  on storage.objects for delete
  using (bucket_id = 'artwork-images' and auth.uid() is not null);

-- 4. Optional index for sorting
create index if not exists artworks_sort_order_idx on artworks (sort_order, created_at);

-- ============================================================
-- Setup instructions
-- ============================================================
-- After running this SQL:
-- 1. Go to Authentication → Users in your Supabase dashboard and
--    create an admin user (email + password).
-- 2. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment
--    variables in your Replit project (Secrets panel).
-- 3. Visit /admin in the portfolio, sign in with the credentials
--    you created in step 1, and start managing artworks.
--
-- Security model:
--   - The anon key alone cannot write to the artworks table or
--     upload/delete files — auth.uid() must be non-null.
--   - Public reads (gallery) work without authentication.
--   - Supabase Auth issues a signed JWT on sign-in; the supabase-js
--     client attaches it automatically to every subsequent request.
--
-- Only the image is required when creating an artwork.
-- All other fields (title, year, medium, dimensions, category,
-- status, price, sort_order) are optional and may be left null.
-- ============================================================
