# Quiko — Feature Walkthrough

A guided tour of everything the app does today, so you can click through each
flow yourself. Do this **after** the setup in [`README.md`](./README.md).

> **Your task:** walk every flow below, then **post a flow of your own** — pick
> one end-to-end journey (e.g. "sender posts a package → matches → pays →
> traveller delivers → sender rates"), sketch it as a short step-by-step or a
> Mermaid diagram, and post it on the **QKO Jira board** (or your onboarding PR).
> It's how we confirm you've understood the app before you start changing it.

---

## 0. Load the demo data

```bash
cd quiko-app
npm run db:up          # Postgres (Docker)
npm run db:migrate     # schema
npm run db:fixtures     # ← walkthrough dataset (see README "Seeding")
npm run dev
```

Everything mocks OTP — log in with any of these phones + code **`3456`**:

| Phone | Who | Use it to see |
|---|---|---|
| `918888800001` | **Sam Sender** | Packages + matches in every state |
| `918888800002` | **Tara Traveller** | Trips, carrying + delivered |
| `919999900001` | **Admin** | The full admin/ops console |
| `91939313463` | **Support** | The assist-only support console |

Tip: use two browser windows (one normal, one private) to be a sender **and** a
traveller at the same time.

---

## 1. Sender — post & discover  *(log in as Sam)*

- **Home → Send a Package.** Set pickup/drop on the map, weight, and a
  **Description**. (Notice the map + address search — it's OpenStreetMap in dev.)
- **Explore travellers.** Sort (arrival / departure / rating / trust) and filter
  by **transport** and **rating**. Each card shows a rating and a **View profile**
  link → the traveller's public profile with reviews.
- Package **`Laptop sleeve`** is active with no match yet → use **Find travellers**
  to browse and send a request.

## 2. Traveller — post a trip  *(log in as Tara)*

- **Home → Travel & Earn → Post a trip.** Note the **4-hour time windows**
  (e.g. "8 AM – 12 PM") instead of exact times.
- Turn on **"Willing to detour to earn more?"** → a slider (+1…+10 km) appears.
- On the trip screen you'll see what she's **Carrying**, plus a **Cancelled**
  history section.

## 3. The match lifecycle  *(Sam has one match in each state)*

Open each package (Sam → a package → its match card):

- **Paid** (in progress) — money held in escrow; the detour toggle and delivery
  OTP are here.
- **Completed** — delivered, with proof photos (if added) and Sam's **review**
  showing on Tara's profile. Note the **price breakdown** (base + door-to-door detour).
- **Disputed** — "Delivery under review". Sam (who raised it) sees **Withdraw
  dispute**; both sides are frozen until it's resolved.
- **Cancelled** — appears in the **Cancelled history** on both the package and
  the trip; the package reopened to `active`.

As the traveller (Tara), advance a live delivery: **Mark picked up** (add a
**photo**) → **Mark in transit** → **Confirm delivery** with the OTP.

## 4. Chat safety & coordination

Open any match → **Message**:
- Try sending a **phone number** → it's blocked (and auto-flags a moderation report).
- Tap the **📍** to drop a **location pin** — the safe way to coordinate pickup.
- Use the **⚑** in the chat header to **report** the other person.

## 5. Support  *(customer + staff)*

- As **Sam**: Profile → **Get help / Support**, or **"Get help with this
  delivery"** on a package. Chat with support; either side can **Mark resolved / Reopen**.
- As **Support** (`91939313463`): Profile → **Open ops console** → **Support**
  queue → reply to Sam's open thread.

## 6. Admin / ops console  *(log in as Admin)*

Profile → **Open admin panel**:
- **Dashboard** — counts, GMV/commission, operational metrics, demand/supply routes,
  and red banners for anything pending.
- **Search** → open a **match** to see timeline (with **timings**), transactions,
  chat, and proof photos in one place.
- **Disputes** — resolve the open one: **Refund** / **Release** / **Dismiss**.
- **Moderation** — the auto-flagged "shared contact info" report → **Warn / Suspend / Dismiss**.
- **Matching** — an unmatched package → candidate trips ranked by detour → **Match**.
- **Users / Transactions / Audit** — user actions, money history, and the admin action log.

### Support vs Admin (roles)
Log in as **Support** and open the same console: you'll see **fewer tabs** and
**no money buttons** — support can chat, search (read), dismiss disputes, and
warn/dismiss reports, but **cannot** refund, suspend, or see financials. That's
the assist-only tier (`profiles.staff_role`).

## 7. Demo / provider modes

Three external services run in free/mock mode locally and swap to real providers
via one env var each (see `.env.example`):
- **Payments** — simulated escrow (no real money). Real: Cashfree Easy Split.
- **SMS OTP** — mock (code = `3456`). Real: MSG91.
- **Maps** — free OpenStreetMap. Real: MapTiler.

---

## Where to dig deeper

- [`plan.md`](./plan.md) — the running log of every feature, decision, and what's pending.
- [`quiko-app/ARCHITECTURE.md`](./quiko-app/ARCHITECTURE.md) — how the code is organized.
- `quiko-app/lib/queries/` (DB), `app/app/actions.ts` (server actions), `app/api/` (JSON API for mobile), `quiko-app/core/` (shared logic).

**Reminder:** once you've toured the flows, **post your own flow** on the QKO board. 🚀
