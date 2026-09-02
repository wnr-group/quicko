# Quiko App — Architecture

**Stack:** Next.js 16 (App Router, Turbopack) + React 19 + Tailwind v4 · PWA.
**Strategy:** ship the web PWA now, then build React Native (iOS/Android) reusing
the `core/` layer + the same API. See `/docs` for product context, `PRODUCTION_PLAN.md`
for phase status.

## Tech stack

| Concern | Choice |
|---|---|
| Web / API | Next.js 16 (Route Handlers + Server Actions) |
| DB | PostgreSQL — standalone (local: docker-compose; prod: any Postgres) |
| ORM / migrations | Drizzle + drizzle-kit over a **direct `DATABASE_URL`** |
| Auth | **Custom JWT sessions** (`jose`, httpOnly cookie) |
| OTP | **MSG91** in prod · mock provider in dev (`lib/otp.ts`) |
| Validation | Zod |
| Payments (P3) | Razorpay Route escrow |

No Supabase. No vendor auth. The DB is plain Postgres; move it by changing `DATABASE_URL`.

## The portability rule (why the app is split this way)

```
core/       ← framework-agnostic TypeScript (types, pricing, cities, format).
            ← NO react/next/db imports. The React Native app imports this VERBATIM.
db/         ← Drizzle schema + client. The only place that talks to Postgres.
lib/        ← server-only seams: auth (session, otp), queries/, validation.
app/        ← Next.js routes + server actions. Thin — compose lib + components.
components/ ← React (web) UI.
```

- Business logic lives in `core/` and `lib/queries/`. Keep `core/` import-clean or RN reuse breaks.
- All data access goes through Drizzle in `lib/queries/*` — never a vendor SDK.

## Auth architecture (custom)

Coupling is contained to a few files:
- `lib/session.ts` — sign/verify JWT, set/clear the `quiko_session` cookie (`jose`).
- `lib/otp.ts` — OTP provider seam: mock (dev, code = `DEV_OTP`) ↔ MSG91 (prod, if `MSG91_AUTH_KEY` set).
- `lib/auth.ts` — `getAuthUser()` / `requireUser()` / `getProfile()`; every page calls these.
- `app/login/actions.ts` — `sendOtpAction`, `verifyOtpAction` (upsert profile + create session), `signOutAction`.

`profiles` is the primary user table (phone = login identity). A profile is
find-or-created on OTP verify — no external auth table, no trigger.

## Implemented (P0 + P1)

- Auth: phone OTP → JWT session → session-gated `/app` (redirects to `/login`).
- Sender core: create package (server-priced) → matching travelers (ranked by trust)
  → request → accept → confirmed match (atomic txn, delivery OTP).
- Routes: `/` splash · `/login` · `/app` home · `/app/packages/new` · `/app/packages/[id]` ·
  `/app/packages/[id]/travelers` · `/app/travel` (P2 placeholder).

## Next

**P2** Traveler core · **P3** Razorpay escrow + handoff (photo verify, ratings) ·
**P4** chat/push/KYC · **P5** admin · **P6** React Native (reuses `core/` + the API).
Storage (photos/KYC) and realtime (chat) land at P3/P4 behind `lib/` seams —
choose any provider (S3/R2, WebSocket/Ably); nothing is committed yet.
