-- ============================================================
-- AlfaDrive — Supabase Setup Script  (v2)
-- Run this in the Supabase SQL Editor (once)
-- ============================================================

-- ── 1. Create the cars table ────────────────────────────────
CREATE TABLE IF NOT EXISTS cars (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand             text        NOT NULL,
  model             text        NOT NULL,
  year              integer     NOT NULL,
  price_per_day     numeric(10,2) NOT NULL,
  price_2_day       numeric(10,2),
  price_3_4_day     numeric(10,2),
  price_5_7_day     numeric(10,2),
  price_8_plus_day  numeric(10,2),
  price_with_driver numeric(10,2),
  transmission      text        NOT NULL CHECK (transmission IN ('automatic', 'manual')),
  fuel_type         text        NOT NULL DEFAULT 'Petrol',
  seats             integer     NOT NULL DEFAULT 5,
  engine            text,
  mileage           text,
  features          text[],
  image_url         text,
  available         boolean     NOT NULL DEFAULT true,
  -- v2: 4-state status field (drives the admin dashboard badges)
  status            text        CHECK (status IN ('available', 'rented', 'maintenance', 'inactive')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Add status column if the table already exists ────────
-- (Safe to run on existing tables — ALTER TABLE IF NOT EXISTS is not supported,
--  so we use the DO block trick instead.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'status'
  ) THEN
    ALTER TABLE cars ADD COLUMN status text
      CHECK (status IN ('available', 'rented', 'maintenance', 'inactive'));
  END IF;
END $$;

-- ── 3. Enable Row-Level Security ─────────────────────────────
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS Policies ──────────────────────────────────────────

-- Public: anyone can read all cars (public catalog + admin list)
DROP POLICY IF EXISTS "Public read cars" ON cars;
CREATE POLICY "Public read cars"
  ON cars FOR SELECT
  USING (true);

-- Write access: authenticated users only (Supabase Auth admin account)
DROP POLICY IF EXISTS "Authenticated insert cars" ON cars;
CREATE POLICY "Authenticated insert cars"
  ON cars FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update cars" ON cars;
CREATE POLICY "Authenticated update cars"
  ON cars FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated delete cars" ON cars;
CREATE POLICY "Authenticated delete cars"
  ON cars FOR DELETE
  TO authenticated
  USING (true);

-- Remove old anon write policies if they exist from v1
DROP POLICY IF EXISTS "Anon can insert cars" ON cars;
DROP POLICY IF EXISTS "Anon can update cars" ON cars;
DROP POLICY IF EXISTS "Anon can delete cars" ON cars;

-- ── 5. Storage bucket for car images ─────────────────────────
-- Run this separately in Supabase Dashboard → Storage if you prefer the UI,
-- or execute here. The bucket must be PUBLIC for image_url links to work.
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated upload car images" ON storage.objects;
CREATE POLICY "Authenticated upload car images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'car-images');

-- Allow anyone to view car images (public bucket)
DROP POLICY IF EXISTS "Public read car images" ON storage.objects;
CREATE POLICY "Public read car images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-images');

-- Allow authenticated users to delete/replace images
DROP POLICY IF EXISTS "Authenticated delete car images" ON storage.objects;
CREATE POLICY "Authenticated delete car images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'car-images');

-- ── 6. Seed data (optional — remove if unwanted) ─────────────
INSERT INTO cars (
  brand, model, year,
  price_per_day, price_2_day, price_3_4_day, price_5_7_day, price_8_plus_day, price_with_driver,
  transmission, fuel_type, seats, engine, features, available, status
) VALUES
  (
    'Toyota', 'Camry', 2022, 65, 60, 55, 50, 45, 90,
    'automatic', 'Hybrid', 5, '2.5L Hybrid',
    ARRAY['Android Auto', 'Apple CarPlay', 'Lane Assist', 'Heated Seats'],
    true, 'available'
  ),
  (
    'Hyundai', 'Tucson', 2023, 75, 70, 65, 58, 52, 100,
    'automatic', 'Petrol', 5, '2.0L',
    ARRAY['Panoramic Roof', 'Blind Spot Monitor', 'Wireless Charging'],
    true, 'available'
  ),
  (
    'Mercedes-Benz', 'GLE 300d', 2022, 140, 130, 120, 110, 100, 180,
    'automatic', 'Diesel', 5, '2.0L Diesel',
    ARRAY['Leather Interior', '360° Camera', 'Burmester Audio', 'Air Suspension'],
    true, 'available'
  )
ON CONFLICT DO NOTHING;

-- ── 7. Create admin user ──────────────────────────────────────
-- IMPORTANT: Create your admin account in Supabase Dashboard →
-- Authentication → Users → "Add user" (email/password).
-- Do NOT store credentials in this file.
-- After creating the user, they can log in at /admin/login.
