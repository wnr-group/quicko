# Quiko Mobile (Expo / React Native)

Native app for Quiko, built with **Expo Router** + TypeScript. It **reuses the
web app's `core/` layer** (pricing, geo, formatting, types) — the same
framework-agnostic logic runs on-device, so the two apps can never drift.

## Status: full screen set, mock data

Project setup, shared-core wiring, auth, tab navigation, and **all the primary
screens** are in place:

- **Login/OTP**, **Home**, **Send → Explore → Details**
- **Matches**, **Match flow** (sender pay + share OTP + rate; traveller
  pickup → in-transit → confirm delivery OTP; tracking timeline)
- **Chat**, **Wallet**, **Notifications**, **Verify (KYC)**

It all runs against a **mock API** (`lib/api.ts`, `EXPO_PUBLIC_MOCK=true`) so the
screens are fully demo-navigable in isolation — actions (pay, advance, confirm
OTP, send message, submit KYC) update local state so flows feel real. The mock
methods mirror the exact request/response shapes the real endpoints must
implement. Mock delivery OTP is **3456**.

## Run it

```bash
cd quiko-mobile
npm install
npx expo start        # then press i (iOS sim) / a (Android) / scan QR in Expo Go
```

> Requires the Expo toolchain + an iOS simulator / Android emulator (or the Expo
> Go app on a phone). It cannot be run from a plain terminal without those.

## How the shared core works

- `metro.config.js` adds `../quiko-app/core` to `watchFolders` and aliases
  `@core` to it, so `import { inr } from "@core/format"` resolves to the web
  app's real module (see `app/(tabs)/home.tsx`, `send.tsx`).
- `tsconfig.json` mirrors the alias for type-checking.
- No duplication: fix a pricing rule once in `quiko-app/core`, both apps get it.

## Architecture

```
app/
  _layout.tsx          root: SafeArea + AuthProvider + Stack
  index.tsx            entry gate → tabs or login (based on stored token)
  (auth)/login.tsx     phone → OTP → token
  (tabs)/
    _layout.tsx        bottom tabs (Home · Send · Profile), auth-guarded
    home.tsx           greeting + packages + shared-core price demo
    send.tsx           route → explore travellers (shared date/transport fmt)
    profile.tsx        identity/verify + sign out
lib/
  api.ts               fetch client, bearer token, MOCK mode + endpoint contract
  auth.tsx             AuthContext; token persisted in expo-secure-store
  theme.ts             brand tokens mirrored from the web globals.css
components/ui.tsx      Button / Card / Pill
```

## Next step: turn off MOCK (needs the web JSON API)

The web app is currently 100% Next.js server actions + RSC — it exposes **no
JSON API**. To make this app talk to real data, add these bearer-token endpoints
to `quiko-app/app/api/` (shapes defined in `lib/api.ts`):

| Method | Path                     | Returns                                  |
| ------ | ------------------------ | ---------------------------------------- |
| POST   | `/api/auth/otp/send`     | `{ ok }`                                 |
| POST   | `/api/auth/otp/verify`   | `{ token, needsOnboarding }` (JWT)       |
| GET    | `/api/me`                | `Me`                                     |
| GET    | `/api/explore/trips`     | `ExploreTrip[]`                          |
| GET    | `/api/packages`          | `MyPackage[]`                            |

…plus the endpoints the ported screens call (all in `lib/api.ts`): `/matches`,
`/matches/:id`, `/matches/:id/{pay,advance,deliver,rate}`, `/chat/:matchId`
(GET + POST), `/wallet`, `/notifications` (+`/unread`, `/read`), `/kyc`
(GET + POST), `/packages` (POST).

Auth: issue the existing `jose` JWT as a **bearer token** on verify (instead of
only the httpOnly cookie), and validate `Authorization: Bearer <jwt>` in the
route handlers. Then set `EXPO_PUBLIC_MOCK=false` and everything is live.
