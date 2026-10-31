// Geocoding via Mapbox Geocoding API v6 (forward autocomplete + reverse).
// Runs in the browser with the public token (see lib/maps.ts). Results are
// cached in memory and in-flight searches can be aborted, so typing and
// map-dragging don't burn requests.
import { MAPBOX_COUNTRY, MAPBOX_TOKEN } from "@/lib/maps";

export type Place = { lat: number; lng: number; label: string };

const BASE = "https://api.mapbox.com/search/geocode/v6";
const coordFallback = (lat: number, lng: number) => `${lat.toFixed(3)}, ${lng.toFixed(3)}`;

// One search session groups a user's keystrokes + final pick into one billing
// session. Rotate it after a place is chosen.
//
// crypto.randomUUID() only exists in a SECURE CONTEXT. localhost qualifies but a
// LAN origin like http://192.168.x.x does not — and that is exactly how the app
// is opened on a phone during development. At module scope an undefined
// randomUUID would throw on import and take down every screen that pulls this
// module in, so resolve it lazily and fall back to a plain random id. This value
// only has to be unique per search session; it is not a security token.
const newSessionId = (): string => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch { /* not a secure context — fall through */ }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

let session: string | null = null;
const sessionId = () => (session ??= newSessionId());
export const endSearchSession = () => { session = newSessionId(); };

const cache = new Map<string, Promise<unknown>>();
/** Insert under the shared size cap, so no caller can grow the map unbounded. */
function remember(key: string, value: Promise<unknown>): void {
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
}
function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit) return hit as Promise<T>;
  const p = load().catch((e) => { cache.delete(key); throw e; });
  remember(key, p);
  return p;
}

type Feature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
};

/** "Anaikatti Road, Coimbatore" — name plus its locality, no state/country tail. */
function labelOf(f: Feature): string {
  const p = f.properties ?? {};
  const name = p.name_preferred || p.name || "";
  const locality = (p.place_formatted ?? "").split(",")[0]?.trim();
  return [...new Set([name, locality].filter(Boolean))].join(", ");
}

function toPlace(f: Feature): Place | null {
  const c = f.properties?.coordinates;
  const g = f.geometry?.coordinates;
  // The place's own coordinates, so the pin sits on the shop/house/building the
  // user searched for. (routable_points are road-access points in front of it;
  // the Directions API snaps to the road itself, so routes are unaffected.)
  const lat = c?.latitude ?? g?.[1];
  const lng = c?.longitude ?? g?.[0];
  if (lat == null || lng == null) return null;
  return { lat, lng, label: labelOf(f) || coordFallback(lat, lng) };
}

/** Reverse-geocode a point to a short label. Never throws; falls back to coords. */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!MAPBOX_TOKEN) return coordFallback(lat, lng);
  // ~11 m grid: dragging the map re-uses nearby results.
  const key = `r:${lat.toFixed(4)},${lng.toFixed(4)}`;
  try {
    return await memo(key, async () => {
      const r = await fetch(
        `${BASE}/reverse?longitude=${lng}&latitude=${lat}&country=${MAPBOX_COUNTRY}&language=en&limit=1&access_token=${MAPBOX_TOKEN}`,
      );
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as { features?: Feature[] };
      const f = d.features?.[0];
      return (f && labelOf(f)) || coordFallback(lat, lng);
    });
  } catch {
    return coordFallback(lat, lng);
  }
}

export type Suggestion = { id: string; label: string; detail: string };

const SEARCH = "https://api.mapbox.com/search/searchbox/v1";

type SbSuggestion = {
  mapbox_id: string;
  name?: string;
  name_preferred?: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
};

/**
 * Autocomplete via the Search Box API, which — unlike plain geocoding — also
 * finds shops, businesses and landmarks, not just streets and areas. Suggestions
 * carry no coordinates; call retrievePlace() on the one the user picks.
 * Biased toward `near`. Returns null when the lookup FAILED (as opposed to an
 * empty array, which means it succeeded and nothing matched) so the caller can
 * tell "no such place" apart from "search is down".
 */
export async function searchPlaces(
  q: string,
  opts: { near?: { lat: number; lng: number }; signal?: AbortSignal } = {},
): Promise<Suggestion[] | null> {
  const query = q.trim();
  if (!MAPBOX_TOKEN) return null;
  if (query.length < 3) return [];
  const prox = opts.near ? `&proximity=${opts.near.lng},${opts.near.lat}` : "";
  const url =
    `${SEARCH}/suggest?q=${encodeURIComponent(query)}&country=${MAPBOX_COUNTRY}&language=en` +
    `&limit=8&session_token=${sessionId()}${prox}&access_token=${MAPBOX_TOKEN}`;
  try {
    const hit = cache.get(`s:${url}`);
    if (hit) return (await hit) as Suggestion[];
    const r = await fetch(url, { signal: opts.signal });
    if (!r.ok) return null;
    const d = (await r.json()) as { suggestions?: SbSuggestion[] };
    const out = (d.suggestions ?? []).map((x) => ({
      id: x.mapbox_id,
      label: x.name_preferred || x.name || "",
      // Street/area line shown under the name, so two branches of one store differ.
      detail: x.address && x.place_formatted ? `${x.address}, ${x.place_formatted}` : (x.full_address || x.place_formatted || ""),
    })).filter((x) => x.id && x.label);
    remember(`s:${url}`, Promise.resolve(out));
    return out;
  } catch (e) {
    // An abort is the caller superseding this search, not a failure.
    if ((e as Error | undefined)?.name === "AbortError") return [];
    return null;
  }
}

/** Coordinates for a picked suggestion (this closes the billing session). */
export async function retrievePlace(s: Suggestion, signal?: AbortSignal): Promise<Place | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const r = await fetch(
      `${SEARCH}/retrieve/${encodeURIComponent(s.id)}?session_token=${sessionId()}&access_token=${MAPBOX_TOKEN}`,
      { signal },
    );
    if (!r.ok) return null;
    const d = (await r.json()) as { features?: Feature[] };
    const f = d.features?.[0];
    return f ? toPlace(f) : null;
  } catch {
    return null;
  }
}
