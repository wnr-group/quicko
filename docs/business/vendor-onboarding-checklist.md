# Quiko — Third-Party Vendor Onboarding Checklist (Ops/Support)

> Purpose: everything the ops/support team must set up with external providers so
> engineering can plug in credentials and build. Designed to run **in parallel**.
> India-focused. Last updated: 2026-08-27.
>
> **Start TODAY:** the **Business KYB Pack (Step 0)** and **SMS DLT registration**
> — DLT operator/template approval is the slowest item (can take 1–3 weeks) and
> blocks all OTP/SMS.

---

## How to read this
- Each provider lists: **what to create → documents/decisions → hand to devs**.
- 🔑 = the credential/output engineering needs at the end.
- 🧑‍💼 = needs a founder/business decision, not just support execution.
- ⏳ = long lead time — start early.

---

## Step 0 — Business KYB Pack (do this ONCE, unblocks everyone) ⏳
Every payment/escrow/SMS provider asks for the same core set. Assemble one clean,
high-quality folder and reuse it. **Poor scans / name mismatches are the #1 cause
of rejections.**

**Documents to collect (soft copies, clear, unexpired):**
- [ ] Certificate of Incorporation / Partnership deed / Udyam (proprietor) — 🧑‍💼 entity must exist
- [ ] **Business PAN**
- [ ] **GST certificate** (GSTIN)
- [ ] **Business bank account** + **cancelled cheque** (name must match entity exactly)
- [ ] Authorized signatory / director: **PAN + Aadhaar**
- [ ] Registered address proof (utility bill / rent agreement)
- [ ] Company logo, brand name, support email, support phone
- [ ] Business description + **business category/MCC** = "peer-to-peer package
      delivery marketplace" (be ready to explain the model — see Cashfree risk note)

**Mandatory live website pages (PAs will NOT approve without these):**
- [ ] Terms & Conditions  ✅ *(exists — `app/terms`)*
- [ ] Privacy Policy  ✅ *(exists — `app/privacy`)*
- [ ] **Refund & Cancellation Policy**  ⚠️ *(needs to be written/published)*
- [ ] **Contact Us** (real email + phone + address)  ⚠️
- [ ] **Pricing / how charges work**  ⚠️
- [ ] Live domain reachable over HTTPS  🧑‍💼

> ⚠️ Action: get Refund/Cancellation, Contact Us, and Pricing pages published on
> the production domain before submitting any payment-gateway application.

---

## 1. Cashfree — Payments + Payouts + KYC ⏳
Three products, **one merchant account**: Easy Split (marketplace payments),
Payouts (pay travelers), Secure ID (KYC).

**Tasks**
- [ ] Create Cashfree account (sandbox + production).
- [ ] Submit the **Step 0 KYB pack**.
- [ ] 🧑‍💼 **Get written approval that a P2P peer-delivery marketplace is an
      accepted category** BEFORE relying on it (some PAs restrict P2P money flow).
- [ ] Request activation of: **Easy Split**, **Payouts**, **Secure ID**.
- [ ] 🧑‍💼 Negotiate/confirm **pricing** for our volumes (avg ticket ₹200–700,
      payout frequency, KYC volume) — public rates are not the real deal.
- [ ] Confirm **maximum fund hold duration** on vendor balances (delivery time).
- [ ] Nominate a technical + a finance contact; set up settlement bank account.

**Hand to devs 🔑**
- [ ] `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` (sandbox + prod)
- [ ] Webhook signing secret
- [ ] Secure ID client id/secret
- [ ] Confirmation of enabled products + approved category (in writing)

> Standard onboarding is ~2–4 business days for accepted categories; longer if
> flagged as high-risk. Sources listed at bottom.

---

## 2. Escrow (real, legal escrow) — DECISION FIRST 🧑‍💼
**Note:** Cashfree/Razorpay do NOT provide true legal escrow — only "hold &
release" (see `plan.md`). Only pursue this if we decide we legally need a
segregated trust account (e.g., high declared-value items, dispute protection).

**Tasks**
- [ ] 🧑‍💼 **Decide: do we need real escrow for MVP, or is Easy Split hold-release
      enough?** (Recommend: hold-release for MVP; revisit escrow later.)
- [ ] If yes: shortlist providers — **Castler** (escrow-as-a-service) or a
      **bank escrow account** (e.g., ICICI/Axis/RBL escrow desk).
- [ ] Submit KYB pack; understand setup fees, per-txn fees, settlement rules.
- [ ] Legal review of escrow agreement + update Terms to reflect true escrow.

**Hand to devs 🔑** (only if pursued)
- [ ] Escrow API credentials + sandbox, or bank escrow ops process.

---

## 3. MSG91 — SMS / OTP + WhatsApp ⏳ (START DLT NOW)
Already integrated (mock in dev). Production SMS to Indian numbers is **legally
blocked** until **TRAI DLT registration** is complete — this is the longest pole.

**Tasks**
- [ ] Create/verify MSG91 production account; submit KYB pack.
- [ ] ⏳ **TRAI DLT registration** (do immediately, in parallel):
  - [ ] Register the entity on a DLT portal (Jio/Airtel/Vodafone/BSNL portal) using
        **PAN + GSTIN + corporate docs** → get the **19-digit Principal Entity (PE) ID**.
  - [ ] Register a **6-character Sender ID / header** (transactional category), e.g. `QUIKOO`.
  - [ ] Register **content templates exactly as sent**, with `{#var#}` placeholders
        (OTP, match alert, payment, delivery, KYC status). Get a **Template ID** per template.
  - [ ] Map **PE ID + approved Template IDs** into the MSG91 dashboard.
- [ ] Draft the actual SMS copy for each template (support + product together).
- [ ] 🧑‍💼 Confirm SMS/OTP/WhatsApp **pricing plan**.

**Hand to devs 🔑**
- [ ] MSG91 **Auth Key**
- [ ] Approved **Sender ID**, **PE ID**, and **DLT Template IDs** (per message type)
- [ ] Final template text + variable order

> Every SMS must pass its DLT Template ID or the operator drops it. Templates must
> match the sent text character-for-character (minus variables). Sources below.

---

## 4. Push Notifications (mobile + web)
For match alerts / status without SMS cost.

**Tasks**
- [ ] 🧑‍💼 **Apple Developer Program** enrolment ($99/yr) — needed for **APNs**
      (iOS push) and App Store. Requires legal entity / D-U-N-S number.
- [ ] **Google / Firebase** project for **FCM** (Android + web push).
- [ ] Generate web push **VAPID** keys (dev-side, but ops should own the accounts).
- [ ] Decide notification content/opt-in copy.

**Hand to devs 🔑**
- [ ] FCM server key / service account JSON
- [ ] APNs auth key (.p8) + Key ID + Team ID
- [ ] VAPID public/private keys

---

## 5. Maps / Geocoding (production) 🧑‍💼
Currently OpenStreetMap + Nominatim (free, no key) — fine for dev, but Nominatim's
usage policy and rate limits make it unsafe for production traffic.

**Tasks**
- [ ] 🧑‍💼 Choose provider: **Google Maps Platform** (best India coverage, paid) or
      **Mapbox** (cheaper, good enough). Consider cost at scale.
- [ ] Create billing account; set **API key restrictions** + budget alerts.
- [ ] Enable needed APIs (Maps, Geocoding, Places/autocomplete).

**Hand to devs 🔑**
- [ ] Maps API key(s) with domain/app restrictions

---

## 6. Hosting / Infra / Domain
**Tasks**
- [ ] 🧑‍💼 Register/confirm **production domain** + DNS access.
- [ ] Choose app hosting (Vercel / AWS) and **managed Postgres** (Neon / Supabase / RDS).
- [ ] Provision **HTTPS** (needed for webhooks + PA approval).
- [ ] Set up a business email on the domain (support@, no-reply@).

**Hand to devs 🔑**
- [ ] DNS access, hosting account access, DB connection string, prod domain URL

---

## 7. App Store Distribution (mobile) ⏳ 🧑‍💼
**Tasks**
- [ ] 🧑‍💼 **Apple Developer** account (also covers APNs above) — legal entity + D-U-N-S.
- [ ] 🧑‍💼 **Google Play Console** account ($25 one-time) — entity verification now required.
- [ ] Prepare store listing assets: name, icon, screenshots, description, privacy
      questionnaire, data-safety form.
- [ ] Expo/EAS account for builds (dev-side, but ops owns the store accounts).

**Hand to devs 🔑**
- [ ] Store account access / team invites, signing setup

---

## 8. Razorpay wind-down (if fully switching)
- [ ] Keep Razorpay live until Cashfree is proven in production.
- [ ] After cutover: reconcile, settle pending, then downgrade/close. Retain
      statements for accounting.

---

## Suggested parallelization (who starts what)

| Track | Owner | Blocked by | Lead time |
|---|---|---|---|
| Step 0 KYB pack + website pages | Ops + Founder | entity/GST existing | 2–5 days |
| **DLT registration (SMS)** ⏳ | Ops | Step 0 (PAN/GST) | **1–3 weeks** |
| Cashfree onboarding | Ops + Finance | Step 0 + website pages | 2–4 days + category approval |
| Escrow decision | Founder | — | decision, then days |
| Push (Apple/Google/FCM) | Ops | entity/D-U-N-S | 2–7 days |
| Maps provider | Founder + Ops | billing | 1 day |
| Hosting/domain | Ops | — | 1–2 days |
| App store accounts | Ops | entity/D-U-N-S | 2–7 days (verification) |

**Critical path = entity/GST → Step 0 pack → (DLT + Cashfree category approval).**
Start DLT and the Cashfree category question first; everything else can trail.

---

## Founder decisions needed (blockers) 🧑‍💼
1. Real escrow for MVP — yes/no? (recommend: no, use Easy Split hold-release)
2. Cashfree pricing/category approval sign-off
3. Maps provider (cost trade-off)
4. Production domain + hosting choice
5. Confirm legal entity type is finalized (drives all KYB)

---

## Sources
- [Cashfree — documents required for a payment gateway](https://www.cashfree.com/blog/documents-required-for-payment-gateway-in-india/)
- [Cashfree — onboarding FAQs](https://www.cashfree.com/docs/help/onboarding-related/general-faqs)
- [Cashfree — KYB solutions](https://www.cashfree.com/kyb-solutions/)
- [MSG91 — DLT process](https://msg91.com/help/dlt-registration-in-india/dlt-process)
- [MSG91 — get DLT content-template approval](https://msg91.com/help/dlt-registration-in-india/get-approval-for-your-sms-content-on-dlt-platform)
- [TRAI DLT regulations overview](https://docs.webengage.com/docs/trai-sms-dlt-regulations-india)
