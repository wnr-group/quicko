# Deployment — Quiko

How the Quiko **web app** (`quiko-app/`) is deployed for the live demo. Written so
another Claude Code session (or a new engineer) can understand and operate it
without re-deriving anything. The Expo app (`quiko-mobile/`) is **not** deployed —
it runs locally in mock mode.

> **Secrets are not in this repo.** Real values (DB password, session secret,
> provider keys) live only in the **Vercel project's Environment Variables** and
> in a git-ignored `.env.vercel` (and `~/Downloads/quiko-vercel.env`) on the
> maintainer's machine. Everything below uses placeholders like `[PASSWORD]`.

---

## 1. Stack at a glance

| Layer | Choice |
|---|---|
| Host | **Vercel** (Hobby), Next.js 16 App Router |
| Function region | **`bom1` (Mumbai)** — pinned in `quiko-app/vercel.json` |
| Database | **Supabase Postgres** (project region `ap-south-1` / Mumbai) |
| DB access | Drizzle ORM over `postgres` (postgres-js) — **no `supabase-js`** |
| Auth | Custom JWT sessions (`jose`, httpOnly cookie `quiko_session`) |
| OTP | Mock provider in the demo (code = `DEV_OTP`); MSG91 if keyed |
| Payments | Simulated escrow by default; Cashfree if keyed |
| Maps | Free OpenStreetMap/Nominatim by default; MapTiler if keyed |
| File storage | **None** — proof photos are base64 data-URIs stored in Postgres |

The app is a **monorepo**. The Next.js app lives in `quiko-app/`, so Vercel's
**Root Directory must be set to `quiko-app`**.

---

## 2. Vercel project settings

- **Root Directory:** `quiko-app` (critical — the repo root is not the app).
- **Framework preset:** Next.js (auto-detected).
- **Region:** `bom1` — set via `quiko-app/vercel.json`:
  ```json
  { "$schema": "https://openapi.vercel.sh/vercel.json", "regions": ["bom1"] }
  ```
  (Also confirmable in a deployment's **Functions** tab.)
- **Build/deploy:** auto-deploys on push to `main` (GitHub `wnr-group/quicko`).

---

## 3. Environment variables (Vercel → Settings → Environment Variables)

**Required (3):**

| Var | Value shape |
|---|---|
| `DATABASE_URL` | Supabase **transaction pooler** (port `6543`), e.g. `postgresql://postgres.<project-ref>:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require` |
| `SESSION_SECRET` | 32+ bytes, `openssl rand -base64 32` |
| `DEV_OTP` | `345678` (the demo login/handoff OTP — see §6) |

Notes:
- The DB password contains characters that must be **URL-encoded** in the string
  (e.g. `@` → `%40`).
- `?pgbouncer=true&sslmode=require` is **required** — without `sslmode` the
  connection can hang.

**Optional — leave UNSET for the demo** (each has a mock/free default):
`CASHFREE_*` (payments → simulated), `MSG91_*` (OTP → mock), `NEXT_PUBLIC_MAPTILER_KEY`
(maps → free OSM), `APP_URL` (only affects notification link hosts).

The full template is `quiko-app/.env.example`.

---

## 4. Database (Supabase)

Supabase gives two connection strings — **use the right one for the right job**:

| Purpose | Pooler | Port | Notes |
|---|---|---|---|
| **App runtime** (Vercel) | Transaction (PgBouncer) | `6543` | `?pgbouncer=true&sslmode=require`; **no prepared statements** |
| **Migrations / seeding** | Session | `5432` | run from a laptop, not serverless |

### Runtime connection config — `quiko-app/db/index.ts`

The single DB entry point. Configured for the Supabase transaction pooler +
serverless:

```ts
postgres(connectionString, {
  max: 10,             // pooler multiplexes; avoids head-of-line blocking
  prepare: false,      // PgBouncer transaction mode can't do prepared statements
  idle_timeout: 20,    // recycle idle connections
  max_lifetime: 60*30, // hard-recycle every 30 min
  connect_timeout: 15, // fail fast instead of hanging forever
})
```
The client is cached on `globalThis` for warm-instance reuse.

---

## 5. Migrations & seeding (one-time, from a laptop)

Schema is **not** applied automatically on deploy. Point Drizzle at the Supabase
**session pooler (`5432`)** and run migrations. `drizzle.config.ts` reads
`DATABASE_URL` from `quiko-app/.env.local`, so temporarily set it there:

```bash
cd quiko-app
# .env.local DATABASE_URL → the SESSION pooler (5432) string
npm run db:migrate     # applies the 18 migrations in quiko-app/drizzle/
npm run db:fixtures    # OPTIONAL: seeds demo users + sample data (see §6)
# then restore .env.local DATABASE_URL back to local Postgres for dev
```

`db:fixtures` is idempotent (fixed UUIDs) and only touches its own seed rows.

---

## 6. Auth & demo logins

- Login is **phone + OTP**. In the demo the OTP provider is the **mock** one
  (no `MSG91_AUTH_KEY` set), so **any phone** logs in with the code **`DEV_OTP`
  = `345678`** (6 digits everywhere: login, pickup, delivery).
- Sessions are a custom JWT in the httpOnly cookie `quiko_session`
  (`lib/session.ts`), signed with `SESSION_SECRET`.
- **Seeded demo accounts** (after `db:fixtures`, OTP `345678`):

  | Phone | Role |
  |---|---|
  | `918888800001` | Sam Sender |
  | `918888800002` | Tara Traveller |
  | `919999900001` | Admin (full admin console) |
  | `91939313463` | Support (assist-only console) |

- ⚠️ **The demo URL is wide open** — mock OTP means anyone can log in as any
  phone, including admin. Acceptable for a throwaway demo only.

---

## 7. Redeploy checklist

1. Push/merge to `main` (Vercel auto-builds), or hit **Redeploy** on the newest
   commit.
2. Confirm the build is the intended commit and **Root Directory = `quiko-app`**.
3. Confirm the deployment's **Functions region = Mumbai (bom1)**.
4. Env vars present: `DATABASE_URL` (pooler, with `sslmode=require`),
   `SESSION_SECRET`, `DEV_OTP=345678`.
5. Hard-refresh the browser (a stale tab can 404 Server Actions after a deploy).

---

## 8. KNOWN ISSUE — intermittent hangs on Supabase + Vercel serverless

**Symptom:** pages that run several DB queries — most visibly the **admin
console** (`/admin`, ~15 queries) — sometimes hang. The RSC navigation fetch
(`admin?_rsc=…`) returns **200 but stays Pending forever**, so the page never
opens. Login has also intermittently "stuck."

**Root cause:** Supabase's connection pooler drops idle server-side connections,
and Vercel **freezes** the serverless function (and its connection-cleanup
timers) between requests. On thaw, the app reuses a now-dead socket and the query
hangs until it's cancelled. This is a structural mismatch between a
persistent-connection pooler and frozen serverless functions — **not** a data,
schema, gate, or latency problem (verified: DB healthy, admin `staff_role`
correct, functions already colocated in `bom1`).

**Mitigations already applied** (reduce, don't eliminate): `prepare:false`,
`idle_timeout`/`max_lifetime`/`connect_timeout`, `max:10`, region pin to `bom1`,
and parallelized admin queries.

**Recommended real fix: migrate the demo DB to [Neon](https://neon.tech).** Neon's
serverless driver talks over HTTP/WebSocket — no persistent connections to go
stale — which eliminates this class of hang on Vercel. Plan:
1. Create a Neon project (AWS **ap-south-1 / Mumbai**), get its pooled connection string.
2. Swap `db/index.ts` to `drizzle-orm/neon-serverless` (supports the app's
   `db.transaction()` calls). Schema/queries/seed are unchanged.
3. Re-run migrations + fixtures against Neon; set Vercel `DATABASE_URL` to Neon.

---

## 9. Running locally (for contrast)

- DB: local Postgres via Docker — `cd quiko-app && npm run db:up` (host port `5433`).
- `.env.local`: `DATABASE_URL=postgresql://quiko:quiko@127.0.0.1:5433/quiko`,
  `SESSION_SECRET=<any 32+ chars>`, `DEV_OTP=345678`.
- Migrate/seed: `npm run db:migrate && npm run db:fixtures`.
- Run: `npm run dev` → http://localhost:3000. Log in with OTP `345678`.

See `README.md` for the full local setup and `WALKTHROUGH.md` for a feature tour.
