import { Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

// Cross-platform token storage: SecureStore on native, localStorage on web
// (expo-secure-store has no web implementation).
const isWeb = Platform.OS === "web";
async function storeGet(k: string): Promise<string | null> {
  if (isWeb) return typeof localStorage !== "undefined" ? localStorage.getItem(k) : null;
  return SecureStore.getItemAsync(k);
}
async function storeSet(k: string, v: string): Promise<void> {
  if (isWeb) { if (typeof localStorage !== "undefined") localStorage.setItem(k, v); return; }
  await SecureStore.setItemAsync(k, v);
}
async function storeDel(k: string): Promise<void> {
  if (isWeb) { if (typeof localStorage !== "undefined") localStorage.removeItem(k); return; }
  await SecureStore.deleteItemAsync(k);
}

// ---------------------------------------------------------------------------
// Mobile API client.
//
// The web app currently exposes NO JSON API (it's all Next.js server actions),
// so this client runs in MOCK mode by default and returns sample data — enough
// to develop and demo every RN screen in isolation. The request/response shapes
// here ARE the contract the future web JSON API (app/api/*) must implement.
//
// When that ships, set EXPO_PUBLIC_MOCK=false and every method hits the real
// bearer-token endpoint via req().
// ---------------------------------------------------------------------------

const BASE =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000";

const MOCK = (process.env.EXPO_PUBLIC_MOCK ?? "true") !== "false";
export const IS_MOCK = MOCK;

const TOKEN_KEY = "quiko_token";
let token: string | null = null;

export async function loadToken(): Promise<string | null> {
  token = await storeGet(TOKEN_KEY);
  // A leftover mock token is useless against the real API — force a clean login.
  if (token === "mock.jwt.token" && !MOCK) {
    await storeDel(TOKEN_KEY);
    token = null;
  }
  return token;
}
export async function setToken(t: string): Promise<void> {
  token = t;
  await storeSet(TOKEN_KEY, t);
}
export async function clearToken(): Promise<void> {
  token = null;
  await storeDel(TOKEN_KEY);
}

// Registered by AuthProvider so a 401 anywhere can boot the user back to login.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (res.status === 401) {
    // Stale/expired token — drop it and send the user back to login.
    await clearToken();
    onUnauthorized?.();
    throw new Error("Please sign in again");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const delay = <T>(v: T, ms = 250): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));

// ---- Types (shared shape with the web queries) ----------------------------
export type Me = { id: string; fullName: string | null; phone: string; kycLevel: number };
export type MatchStatus =
  | "confirmed" | "paid" | "picked_up" | "in_transit" | "delivered" | "completed";
export type Role = "sender" | "traveler";

export type ExploreTrip = {
  id: string; travelerName: string; transport: string;
  travelDate: string; arriveDate: string | null; departTime: string | null; arriveTime: string | null;
};
export type MyPackage = { id: string; fromCity: string; toCity: string; weightKg: number; status: string };

export type MatchSummary = {
  id: string; role: Role; fromCity: string; toCity: string;
  counterpartName: string; status: MatchStatus; price: number;
};
export type MatchDetail = MatchSummary & {
  pickupOtp: string; otp: string; weightKg: number; receiverName: string | null; receiverPhone: string | null;
};

export type Message = { id: string; mine: boolean; body: string; at: string };
export type Thread = { counterpartName: string; fromCity: string; toCity: string; messages: Message[] };

export type Payout = { id: string; amount: number; fromCity: string; toCity: string; at: string };
export type Upcoming = { id: string; amount: number; status: MatchStatus; fromCity: string; toCity: string };
export type Wallet = { earned: number; pending: number; deliveries: number; payouts: Payout[]; upcoming: Upcoming[] };

export type Notif = { id: string; type: string; title: string; body: string; at: string; read: boolean };
export type Kyc = { status: "pending" | "verified" | "rejected"; notes: string | null } | null;

// ---- Endpoints ------------------------------------------------------------
export const api = {
  // auth
  sendOtp: (phone: string) =>
    MOCK ? delay({ ok: true as const }) : req<{ ok: true }>("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, code: string) =>
    MOCK
      ? delay({ token: "mock.jwt.token", needsOnboarding: false })
      : req<{ token: string; needsOnboarding: boolean }>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }) }),

  // reads
  me: () => (MOCK ? delay(MOCK_ME) : req<Me>("/me")),
  myPackages: () => (MOCK ? delay(MOCK_PACKAGES) : req<MyPackage[]>("/packages")),
  exploreTrips: (p: { fromLat: number; fromLng: number; toLat: number; toLng: number }) =>
    MOCK
      ? delay(MOCK_TRIPS)
      : req<ExploreTrip[]>(`/explore/trips?fromLat=${p.fromLat}&fromLng=${p.fromLng}&toLat=${p.toLat}&toLng=${p.toLng}`),
  matches: () => (MOCK ? delay(MOCK_MATCHES) : req<MatchSummary[]>("/matches")),
  match: (id: string) =>
    MOCK ? delay(MOCK_MATCH_DETAIL(id)) : req<MatchDetail>(`/matches/${id}`),
  thread: (matchId: string) => (MOCK ? delay(MOCK_THREAD) : req<Thread>(`/chat/${matchId}`)),
  wallet: () => (MOCK ? delay(MOCK_WALLET) : req<Wallet>("/wallet")),
  notifications: () => (MOCK ? delay(MOCK_NOTIFS) : req<Notif[]>("/notifications")),
  unreadCount: () => (MOCK ? delay(MOCK_NOTIFS.filter((n) => !n.read).length) : req<number>("/notifications/unread")),
  kyc: () => (MOCK ? delay<Kyc>(null) : req<Kyc>("/kyc")),

  // writes (mock returns ok; screens hold local state for demo realism)
  createPackage: (input: {
    fromLabel: string; fromLat: number; fromLng: number;
    toLabel: string; toLat: number; toLng: number;
    weightKg: number; description: string; tripId?: string;
  }) =>
    MOCK ? delay({ ok: true as const, id: "new" }) : req<{ ok: true; id: string }>("/packages", { method: "POST", body: JSON.stringify(input) }),
  payForMatch: (matchId: string) =>
    MOCK ? delay({ ok: true as const }) : req<{ ok: true }>(`/matches/${matchId}/pay`, { method: "POST" }),
  advanceMatch: (matchId: string, to: "picked_up" | "in_transit", otp?: string) =>
    MOCK
      ? delay(to !== "picked_up" || otp === MOCK_PICKUP_OTP ? { ok: true as const } : { ok: false as const, error: "Incorrect pickup OTP" })
      : req<{ ok: true }>(`/matches/${matchId}/advance`, { method: "POST", body: JSON.stringify({ to, otp }) }),
  confirmDelivery: (matchId: string, otp: string) =>
    MOCK ? delay(otp === MOCK_OTP ? { ok: true as const } : { ok: false as const, error: "Incorrect OTP" }) : req<{ ok: true }>(`/matches/${matchId}/deliver`, { method: "POST", body: JSON.stringify({ otp }) }),
  rate: (matchId: string, stars: number, comment: string) =>
    MOCK ? delay({ ok: true as const }) : req<{ ok: true }>(`/matches/${matchId}/rate`, { method: "POST", body: JSON.stringify({ stars, comment }) }),
  sendMessage: (matchId: string, body: string) =>
    MOCK ? delay({ ok: true as const }) : req<{ ok: true }>(`/chat/${matchId}`, { method: "POST", body: JSON.stringify({ body }) }),
  submitKyc: (input: { idType: string; idNumber: string; legalName: string }) =>
    MOCK ? delay({ ok: true as const }) : req<{ ok: true }>("/kyc", { method: "POST", body: JSON.stringify(input) }),
  markNotificationsRead: () => (MOCK ? delay({ ok: true as const }) : req<{ ok: true }>("/notifications/read", { method: "POST" })),
};

// ---- Mock data ------------------------------------------------------------
export const MOCK_OTP = "3456";
export const MOCK_PICKUP_OTP = "3456";
const MOCK_ME: Me = { id: "mock", fullName: "Sethu Sender", phone: "919000000001", kycLevel: 1 };
const MOCK_TRIPS: ExploreTrip[] = [
  { id: "t1", travelerName: "Arjun Nair", transport: "flight", travelDate: "2026-08-10", arriveDate: "2026-08-10", departTime: "09:30", arriveTime: "11:00" },
  { id: "t2", travelerName: "Meera Iyer", transport: "train", travelDate: "2026-08-11", arriveDate: "2026-08-12", departTime: "21:30", arriveTime: "06:15" },
  { id: "t3", travelerName: "Raj Kumar", transport: "car", travelDate: "2026-08-12", arriveDate: "2026-08-12", departTime: "07:00", arriveTime: "19:00" },
];
const MOCK_PACKAGES: MyPackage[] = [
  { id: "p1", fromCity: "T Nagar, Chennai", toCity: "Andheri, Mumbai", weightKg: 2, status: "matched" },
];
const MOCK_MATCHES: MatchSummary[] = [
  { id: "m1", role: "sender", fromCity: "T Nagar, Chennai", toCity: "Andheri, Mumbai", counterpartName: "Arjun Nair", status: "confirmed", price: 450 },
  { id: "m2", role: "traveler", fromCity: "Koramangala, Bengaluru", toCity: "Powai, Mumbai", counterpartName: "Divya Rao", status: "in_transit", price: 620 },
];
const MOCK_MATCH_DETAIL = (id: string): MatchDetail => {
  const base = MOCK_MATCHES.find((m) => m.id === id) ?? MOCK_MATCHES[0];
  return { ...base, pickupOtp: MOCK_PICKUP_OTP, otp: MOCK_OTP, weightKg: 2, receiverName: null, receiverPhone: null };
};
const MOCK_THREAD: Thread = {
  counterpartName: "Arjun Nair", fromCity: "T Nagar, Chennai", toCity: "Andheri, Mumbai",
  messages: [
    { id: "1", mine: true, body: "Hi Arjun! Where should I hand over the package?", at: "12:18" },
    { id: "2", mine: false, body: "Let's meet at Chennai Central by 8 AM.", at: "12:20" },
  ],
};
const MOCK_WALLET: Wallet = {
  earned: 441, pending: 608, deliveries: 1,
  payouts: [{ id: "x1", amount: 441, fromCity: "T Nagar, Chennai", toCity: "Andheri, Mumbai", at: "2d ago" }],
  upcoming: [{ id: "u1", amount: 608, status: "in_transit", fromCity: "Koramangala, Bengaluru", toCity: "Powai, Mumbai" }],
};
const MOCK_NOTIFS: Notif[] = [
  { id: "n1", type: "paid", title: "Payment secured 🔒", body: "The sender paid — go pick up the package.", at: "just now", read: false },
  { id: "n2", type: "message", title: "New message from Arjun Nair", body: "Let's meet at Chennai Central by 8 AM.", at: "10m ago", read: false },
  { id: "n3", type: "trip_match", title: "A traveller on your route! 🚀", body: "Chennai → Mumbai just posted a trip.", at: "1h ago", read: true },
];
