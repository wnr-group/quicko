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
let session = crypto.randomUUID();
export const endSearchSession = () => { session = crypto.randomUUID(); };

const cache = new Map<string, Promise<unknown>>();
function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit) return hit as Promise<T>;
  const p = load().catch((e) => { cache.delete(key); throw e; });
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
  cache.set(key, p);
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
      routable_points?: { latitude: number; longitude: number }[];
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
  // Prefer the routable point (the road access of an address) over the building
  // centroid, so routes start/end where a vehicle actually goes — as Google does.
  const rp = c?.routable_points?.[0];
  const lat = rp?.latitude ?? c?.latitude ?? g?.[1];
  const lng = rp?.longitude ?? c?.longitude ?? g?.[0];
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
 * Biased toward `near`. Returns [] on failure or abort.
 */
export async function searchPlaces(
  q: string,
  opts: { near?: { lat: number; lng: number }; signal?: AbortSignal } = {},
): Promise<Suggestion[]> {
  const query = q.trim();
  if (!MAPBOX_TOKEN || query.length < 3) return [];
  const prox = opts.near ? `&proximity=${opts.near.lng},${opts.near.lat}` : "";
  const url =
    `${SEARCH}/suggest?q=${encodeURIComponent(query)}&country=${MAPBOX_COUNTRY}&language=en` +
    `&limit=8&session_token=${session}${prox}&access_token=${MAPBOX_TOKEN}`;
  try {
    const hit = cache.get(`s:${url}`);
    if (hit) return (await hit) as Suggestion[];
    const r = await fetch(url, { signal: opts.signal });
    if (!r.ok) return [];
    const d = (await r.json()) as { suggestions?: SbSuggestion[] };
    const out = (d.suggestions ?? []).map((x) => ({
      id: x.mapbox_id,
      label: x.name_preferred || x.name || "",
      // Street/area line shown under the name, so two branches of one store differ.
      detail: x.address && x.place_formatted ? `${x.address}, ${x.place_formatted}` : (x.full_address || x.place_formatted || ""),
    })).filter((x) => x.id && x.label);
    cache.set(`s:${url}`, Promise.resolve(out));
    return out;
  } catch {
    return [];
  }
}

/** Coordinates for a picked suggestion (this closes the billing session). */
export async function retrievePlace(s: Suggestion, signal?: AbortSignal): Promise<Place | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const r = await fetch(
      `${SEARCH}/retrieve/${encodeURIComponent(s.id)}?session_token=${session}&access_token=${MAPBOX_TOKEN}`,
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
