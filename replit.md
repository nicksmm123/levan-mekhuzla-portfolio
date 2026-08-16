# Car Rental Georgia — GTX Rentals

A full-stack car rental website for a Georgian car rental business. Customers browse the fleet and book via WhatsApp; admins manage the fleet through a password-protected dashboard.

## Run & Operate

- `pnpm --filter @workspace/car-rental run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `artifacts/car-rental`)
- Database: Supabase (PostgreSQL via `@supabase/supabase-js`)
- UI: shadcn/ui + Tailwind CSS v4 + Framer Motion
- Routing: Wouter

## Where things live

- `artifacts/car-rental/src/lib/supabase.ts` — Supabase client, Car types, and all DB helper functions
- `artifacts/car-rental/src/` — React pages: public catalog (`/`) and admin dashboard (`/admin`)
- `supabase-setup.sql` — SQL to run in Supabase dashboard to create the `cars` table and RLS policies

## Architecture decisions

- All data access goes directly through Supabase's JS client from the frontend — no custom Express API routes needed for car data
- Admin auth is a client-side hardcoded password ("admin123") — intentionally simple; should be upgraded to Supabase Auth (see Task #1)
- WhatsApp booking uses `wa.me/` deep links with a pre-filled message — no server-side booking flow needed

## Product

- **Public catalog** (`/`): browse available cars, filter by brand/transmission/price, click WhatsApp to book
- **Admin dashboard** (`/admin`): login gate, fleet table with add/edit/delete, full car form

## User preferences

_Populate as you build._

## Gotchas

- Run `supabase-setup.sql` in Supabase SQL Editor before the app shows any cars
- WhatsApp number placeholder is `+995599000000` — update in the catalog page component
- Admin password is `admin123` — change the constant in the admin page component
- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (already configured as secrets)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
