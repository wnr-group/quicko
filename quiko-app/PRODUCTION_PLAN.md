# Quiko — Production Build Plan

Living plan for building the production app. Product context in `/docs`.

## Locked decisions (2026-07-18)

- **Web-first:** Next.js 16 PWA now → React Native later, sharing `core/` + the API.
- **Backend:** **Standalone / no-vendor** (migrated off Supabase 2026-07-24).
  - **Postgres** accessed via **Drizzle ORM over a direct connection string** (migrations in-repo) → DB moves to any Postgres by changing one env var. Local: docker-compose (`npm run db:up`).
  - **Auth: custom JWT sessions** (`jose`, httpOnly cookie) — `lib/session.ts`.
  - **OTP: MSG91** in prod, mock provider in dev — `lib/otp.ts`.
  - `profiles` is the primary user table (phone = identity); find-or-created on OTP verify.
  - **Storage / Realtime:** not built yet; land at P3/P4 behind `lib/` seams (any provider — S3/R2, WebSocket/Ably).
- **Payments:** **Razorpay Route escrow** (decided 2026-07-19). Sender pays → held →
  on delivery OTP auto-split 90% traveler / 10% Quiko. Built in Razorpay **test mode**
  at P3; live keys flip in after business KYC + Route activation. Ledger schema already
  payment-agnostic so nothing blocks earlier phases.

## Portability seams (don't break these)

- **DB:** all reads/writes go through Drizzle over `DATABASE_URL`. Never a vendor SDK
  for data queries. `core/` stays free of React/Next/DB imports.
- **Auth / OTP / Storage / Realtime:** accessed only through `lib/` modules
  (`lib/auth.ts`, `lib/session.ts`, `lib/otp.ts`, and future `lib/storage.ts`,
  `lib/realtime.ts`) — one swappable implementation each.

## Stack

| Concern | Choice |
|---|---|
| Web / API | Next.js 16 (App Router, Route Handlers + Server Actions) |
| DB | Postgres — standalone (local docker-compose → any managed Postgres) |
| ORM / migrations | Drizzle + drizzle-kit (direct `DATABASE_URL`) |
| Auth | Custom JWT sessions (`jose`, httpOnly cookie) |
| OTP | MSG91 (prod) · mock (dev) — `lib/otp.ts` |
| Validation | Zod (shared client/server schemas) |
| Storage / Realtime | Not built (P3/P4, seamed — any provider) |
| Deploy (later) | Vercel (web) + any managed Postgres |

## Data model (P0 schema)

- `profiles` — 1:1 with `auth.users`; name, avatar, phone, trust fields, role prefs
- `kyc_verifications` — level (1–4), status, provider refs
- `packages` — sender postings (route, weight, size, value, category, offer, status)
- `trips` — traveler postings (route, date, windows, transport, capacity, zones)
- `match_requests` — who requested whom, amount, counter, status
- `matches` — confirmed sender↔traveler, package, trip, agreed price, lifecycle status
- `messages` — chat per match
- `transactions` — payment-agnostic ledger (escrow hold, payout, commission, refund)
- `ratings` — bidirectional, multi-criteria
- `notifications` — per user

## P0 checklist (Foundation) — ✅ DONE (2026-07-19)

- [x] Install deps (drizzle-orm, drizzle-kit, postgres, @supabase/ssr, @supabase/supabase-js, zod)
- [x] `supabase init` + `supabase start` — local stack on ports **544xx** (avoids clash with other project)
- [x] Drizzle config + `.env.local` wiring to local DB (portable via `DATABASE_URL`)
- [x] Author schema (10 tables) + generate & apply migration (`npm run db:setup`)
- [x] Supabase↔profiles mirror trigger (`db/platform/`, applied by `npm run db:platform`)
- [x] Auth: phone-OTP login + verify, cookie session (`@supabase/ssr`), `proxy.ts` refresh
- [x] Session-gated app shell (`/app` → redirects to `/login`); old static demo pages removed
- [x] Verified: OTP → session → trigger auto-creates profile row; build + lint clean

### Dev run book (post-Supabase, 2026-07-24)
- Start DB: `npm run db:up` (docker-compose Postgres on :5433) · Stop: `npm run db:down`
- After schema change: `npm run db:generate && npm run db:migrate`
- Seed dev travelers: `npm run db:seed`
- App: `npm run dev` → http://localhost:3000 · Dev login: **any phone + code 123456** (mock OTP)
- Prod OTP: set `MSG91_AUTH_KEY` / `MSG91_TEMPLATE_ID` in env → MSG91 provider kicks in
- E2E: `node scripts/e2e-p1.mjs` (Playwright via system Chrome, server must be running)

## P1 checklist (Sender core) — ✅ DONE (2026-07-19)

- [x] Data layer (Drizzle): `lib/queries/{packages,trips,requests}.ts` + `lib/validation.ts` (zod)
- [x] Server actions: create package (server recomputes price), send request, accept→match (txn)
- [x] UI: role home + my packages · create-package form (live pricing) · browse travelers
      (ranked by trust) · package detail (requests / matched state + delivery OTP)
- [x] Dev seed (`npm run db:seed`) — 3 travelers/trips on Chennai→Mumbai 2026-07-25
- [x] Dev "simulate traveler accept" closes the loop until P2
- [x] Verified: build + lint clean · matching ranks real data (Arjun 295>Raj 198>Meera 103)
      · full create→request→accept→match transaction · new routes auth-gated (307→/login)

Note: full browser click-through (server actions need a real session) is a manual step;
every layer beneath it is validated directly. Dev login **+919999900001 / 123456**,
default package date **2026-07-25** so seeded travelers appear.

## After P1

- **P2** Traveler core (create trip → browse packages → accept → pickup)
- **P3** Money & handoff (Razorpay Route escrow · pickup photo verify · delivery OTP · payout · ratings)
- **P4** Comms & trust (chat, push, KYC, tracking) · **P5** Ops/admin · **P6** React Native
