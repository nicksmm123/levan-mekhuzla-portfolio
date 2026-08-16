-- ============================================================
--  Archive tables & storage setup for Levan Mekhuzla portfolio
--  Run this in Supabase → SQL Editor
-- ============================================================

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists archive_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name_en     text not null,
  name_ka     text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists archive_items (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid references archive_categories(id) on delete set null,
  title_en        text,
  title_ka        text,
  description_en  text,
  description_ka  text,
  media_type      text not null default 'image'
                    check (media_type in ('image', 'video')),
  image_url       text,        -- Supabase storage URL  (when media_type = 'image')
  video_url       text,        -- file URL or embed URL  (when media_type = 'video')
  thumbnail_url   text,        -- optional custom poster for video items
  sort_order      int  not null default 0,
  created_at      timestamptz not null default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────

alter table archive_categories enable row level security;
alter table archive_items      enable row level security;

-- Public read
drop policy if exists "archive_categories_public_read" on archive_categories;
create policy "archive_categories_public_read"
  on archive_categories for select using (true);

drop policy if exists "archive_items_public_read" on archive_items;
create policy "archive_items_public_read"
  on archive_items for select using (true);

-- Authenticated write (admin)
drop policy if exists "archive_categories_auth_write" on archive_categories;
create policy "archive_categories_auth_write"
  on archive_categories for all
  using      (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "archive_items_auth_write" on archive_items;
create policy "archive_items_auth_write"
  on archive_items for all
  using      (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── Seed default categories (only when table is empty) ────────────────────────

insert into archive_categories (slug, name_en, name_ka, sort_order)
select slug, name_en, name_ka, sort_order
from (values
  ('family',      'Family Archive',     'ოჯახის არქივი',      0),
  ('exhibitions', 'Exhibition Archive', 'გამოფენების არქივი', 1),
  ('video',       'Video Archive',      'ვიდეოარქივი',         2),
  ('books',       'Artist Books',       'მხატვრის წიგნები',    3),
  ('materials',   'Materials',          'მასალები',             4)
) as v(slug, name_en, name_ka, sort_order)
where not exists (select 1 from archive_categories limit 1);

-- ── Storage bucket ────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'archive-media',
  'archive-media',
  true,
  104857600,   -- 100 MB limit
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff',
    'video/mp4',  'video/webm', 'video/ogg', 'video/quicktime'
  ]
)
on conflict (id) do nothing;

-- Public read for archive-media
drop policy if exists "archive_media_public_read" on storage.objects;
create policy "archive_media_public_read"
  on storage.objects for select
  using (bucket_id = 'archive-media');

-- Authenticated upload / delete
drop policy if exists "archive_media_auth_insert" on storage.objects;
create policy "archive_media_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'archive-media' and auth.role() = 'authenticated');

drop policy if exists "archive_media_auth_delete" on storage.objects;
create policy "archive_media_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'archive-media' and auth.role() = 'authenticated');
