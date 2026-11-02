// One place that resolves "where is the user now" for every form, so the default
// pickup is the same result every time instead of depending on which attempt
// happened to win. Strategy:
//   1. Reuse a recent fix (module cache, 2 min) — instant and consistent.
//   2. Fast network/Wi-Fi fix (maxAge 30 s). Accept it if accurate (<= 500 m).
//   3. Otherwise ask for a high-accuracy GPS fix (longer timeout) and keep the
//      more accurate of the two.
//   4. Reverse-geocode with retries; only fall back to coordinates if all fail.
import type { PinnedLocation } from "@/core/geo";
import { reverseGeocode } from "@/components/geocode";

export type LocateFailure = "denied" | "unavailable" | "timeout";
export type LocateResult =
  | { ok: true; loc: PinnedLocation }
  | { ok: false; reason: LocateFailure };

export const locateMessage: Record<LocateFailure, string> = {
  denied: "Location permission is off. Allow it in your browser settings, or pick a place manually.",
  unavailable: "Your location isn't available right now. Pick a place manually.",
  timeout: "Couldn't get your location in time. Tap to retry, or pick a place manually.",
};

const TTL_MS = 2 * 60 * 1000;
const GOOD_ACCURACY_M = 500;
let last: { at: number; loc: PinnedLocation } | null = null;

function fix(opts: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, opts));
}

function failure(e: unknown): LocateFailure {
  const code = (e as GeolocationPositionError | undefined)?.code;
  return code === 1 ? "denied" : code === 3 ? "timeout" : "unavailable";
}

async function labelFor(lat: number, lng: number): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const l = await reverseGeocode(lat, lng);
    // reverseGeocode returns "lat, lng" when it couldn't resolve a name.
    if (!/^-?\d+\.\d+, -?\d+\.\d+$/.test(l)) return l;
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return "Current location";
}

export async function locateCurrent(force = false): Promise<LocateResult> {
  if (!force && last && Date.now() - last.at < TTL_MS) return { ok: true, loc: last.loc };
  if (typeof navigator === "undefined" || !("geolocation" in navigator))
    return { ok: false, reason: "unavailable" };

  let best: GeolocationPosition | null = null;
  let err: unknown = null;
  try {
    best = await fix({ enableHighAccuracy: false, maximumAge: force ? 0 : 30_000, timeout: 10_000 });
  } catch (e) {
    err = e;
    if (failure(e) === "denied") return { ok: false, reason: "denied" };
  }
  if (!best || best.coords.accuracy > GOOD_ACCURACY_M) {
    try {
      const gps = await fix({ enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 });
      if (!best || gps.coords.accuracy < best.coords.accuracy) best = gps;
    } catch (e) {
      err = e;
      if (failure(e) === "denied") return { ok: false, reason: "denied" };
    }
  }
  if (!best) return { ok: false, reason: failure(err) };

  const { latitude: lat, longitude: lng } = best.coords;
  const loc: PinnedLocation = { lat, lng, label: await labelFor(lat, lng) };
  last = { at: Date.now(), loc };
  return { ok: true, loc };
}
