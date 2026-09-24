# Quiko

Peer-to-peer package delivery for India — Quiko matches **senders** who need a
package delivered with **travellers** already going that way, holds the payment
in escrow, and releases it on delivery. Quiko keeps a 2% commission.

This is a monorepo containing the web app (which is also the backend/API), the
mobile app, and shared code.

---

## Repository layout

| Path | What it is |
|---|---|
| **`quiko-app/`** | The main app — **Next.js 16** web frontend **and** the backend/API and database. This is where you'll spend most of your time. |
| **`quiko-app/core/`** | Framework-agnostic shared logic (pricing, geo/detour, formatting, moderation). Imported by **both** web and mobile — keep it free of React/Next/RN. |
| **`quiko-mobile/`** | The **Expo / React Native** mobile app. Talks to `quiko-app`'s API. Currently behind the web app (see `plan.md`). |
| **`docs/`** | Product, design, and business docs (incl. the vendor-onboarding checklist). |
| **`WALKTHROUGH.md`** | Guided tour of every feature with demo logins — do this after setup to learn the app. |
| **`plan.md`** | Living plan/journal: every feature built, decisions made, and what's pending. **Read this first** for context. |
| **`quiko-prototype/`** | The original static HTML prototype. Historical reference only — not the live app. |

**Stack:** Next.js 16 (App Router, React 19) · TypeScript · Drizzle ORM · PostgreSQL (Docker) · custom JWT auth (`jose`) · Tailwind · Expo/React Native.

> ⚠️ `quiko-app` runs a **modified Next.js 16**. Read `quiko-app/AGENTS.md` — some APIs differ from the docs you know.

---

## Prerequisites

- **Node.js 20 or newer** (tested on 26). Check with `node -v`.
- **Docker Desktop** (runs the local Postgres). Make sure it's started.
- **npm** (ships with Node).
- For mobile only: the **Expo Go** app or Xcode / Android Studio simulators.

---

## Quick start — web app + API

```bash
cd quiko-app

# 1. Install dependencies
npm install

# 2. Create your local env file, then generate a session secret
cp .env.example .env.local
# edit .env.local → set SESSION_SECRET (run:  openssl rand -base64 32)

# 3. Start Postgres (Docker) — runs on host port 5433
npm run db:up

# 4. Create the schema and load demo data
npm run db:migrate
npm run db:fixtures      # full walkthrough dataset (recommended — see "Seeding")

# 5. Run the app
npm run dev
```

Open **http://localhost:3000**.

### Logging in (dev)

There's no real SMS in dev — OTP is mocked.

- Enter **any Indian phone number**, then the OTP **`3456`**.
- The code is also printed in the server console: `[dev-otp] code for <phone> = 3456`.

### Seeded accounts

| Role | Phone | Notes |
|---|---|---|
| **Admin** | `919999900001` | Full admin console (Profile → *Open admin panel*). |
| **Admin** | `919000000002` | — |
| **Support** | `91939313463` | Assist-only ops console (Profile → *Open ops console*). |

### Seeding the database

Two seed scripts (both idempotent — safe to re-run):

| Command | What it loads |
|---|---|
| `npm run db:fixtures` | **Recommended.** A full walkthrough dataset — demo sender/traveller, staff roles, and matches in every state (paid, delivered+review, disputed, cancelled), plus a support thread and a moderation flag. Creates the logins below. |
| `npm run db:seed` | Minimal — just a few traveller profiles + trips so the "find travellers" list isn't empty. |
| `npm run db:reset` | Re-applies migrations, then runs `db:seed`. |

`db:fixtures` adds these demo logins (OTP `3456`): **Sam Sender** `918888800001`, **Tara Traveller** `918888800002` (plus the admin/support accounts above). Then follow **[`WALKTHROUGH.md`](./WALKTHROUGH.md)** to tour every flow.

> The seeds **upsert** and never delete login profiles — only their own fixture rows — so re-running won't wipe accounts you've created.

---

## Quick start — mobile app

The web app (API) must be running first.

```bash
cd quiko-mobile
npm install
cp .env.example .env      # already points at http://127.0.0.1:3000
npx expo start            # press "i" for iOS simulator, "a" for Android
```

> Use **`127.0.0.1`**, not `localhost`, for the API URL — the iOS simulator
> resolves `localhost` to IPv6 where the dev server isn't listening.

---

## Common commands (`quiko-app`)

| Command | Does |
|---|---|
| `npm run dev` | Start web + API (hot reload). |
| `npm run db:up` / `db:down` | Start / stop the Postgres container. |
| `npm run db:generate` | Generate a new migration after editing `db/schema.ts`. |
| `npm run db:migrate` | Apply pending migrations. |
| `npm run db:seed` | Minimal seed (travellers + trips). |
| `npm run db:fixtures` | Full walkthrough dataset (see *Seeding*). |
| `npm run db:reset` | Migrate + reseed. |
| `npm run db:studio` | Open Drizzle Studio (browse the DB). |
| `npm run lint` | ESLint. |
| `npx tsc --noEmit` | Type-check the whole app. |

**Database:** Postgres runs in Docker on **host port `5433`** (not the default 5432, to avoid clashes). Credentials are `quiko` / `quiko` / `quiko` (see `docker-compose.yml`).

---

## How it's built (orientation)

- **Full-stack in one app.** `quiko-app` is frontend *and* backend. Server code lives in `lib/queries/*` (DB access), Server Actions in `app/app/actions.ts`, and JSON APIs (for mobile) in `app/api/*`. Pages are React Server Components.
- **Shared core.** Anything used by both web and mobile goes in `quiko-app/core/` and must stay framework-agnostic (pure TS).
- **Provider "seams".** External services are swappable behind one config file each, defaulting to a free/mock mode so the app runs with zero accounts:
  - `lib/payments.ts` — Cashfree Easy Split ↔ simulated escrow (default).
  - `lib/otp.ts` — MSG91 SMS ↔ mock OTP (default).
  - `lib/maps.ts` — MapTiler ↔ free OpenStreetMap + Nominatim (default).
  Flip any to production by setting its env var — no code change.
- **Roles.** `profiles.staff_role` is `user` / `support` / `admin` (not the legacy `is_admin`). Gate with `requireAdmin` / `requireSupport` in `lib/auth.ts`.
- **Migrations.** Edit `db/schema.ts` → `npm run db:generate` → `npm run db:migrate`. Never hand-edit the DB.

For the full feature history, decisions, and what's still pending, read **`plan.md`**. Deeper architecture notes are in `quiko-app/ARCHITECTURE.md`.

---

## Environment variables

Copy the templates and fill them in — real values are **never committed**:

- `quiko-app/.env.example` → `quiko-app/.env.local`
- `quiko-mobile/.env.example` → `quiko-mobile/.env`

Everything runs locally with just `DATABASE_URL`, `SESSION_SECRET`, and `DEV_OTP`. The optional provider keys (Cashfree, MSG91, MapTiler) are only needed to leave demo mode.

---

## Troubleshooting

- **App hangs / `spawn … node … ENOENT`** — the dev server was pinned to a Node version that got upgraded (e.g. after `brew upgrade`). Stop and restart `npm run dev`.
- **`ECONNREFUSED` / DB errors** — Postgres isn't up. Run `npm run db:up` (and make sure Docker Desktop is running).
- **Port 3000 in use** — an old dev server is still running: `lsof -ti:3000 | xargs kill`.
- **Mobile can't reach the API** — confirm `EXPO_PUBLIC_API_URL` uses `127.0.0.1` and the web app is running.

---

## Working together

- This repo has no automated tests yet — **type-check (`npx tsc --noEmit`) and run the flow you touched** before pushing.
- Branch off `main`; open a PR for review rather than pushing to `main` directly.
- Keep secrets out of git — only `.env.example` templates are committed.
