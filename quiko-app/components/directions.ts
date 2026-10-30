// Mapbox Directions API v5 — road route between two points, with the polyline
// geometry, distance and duration. Cached per (from,to) so the preview map
// doesn't re-request when a form re-renders.
import { MAPBOX_TOKEN } from "@/lib/maps";
import type { LatLng } from "@/core/geo";
import type { LngLat } from "@/core/routeCorridor";

export interface RoadRoute {
  geometry: LngLat[];
  distanceKm: number;
  durationMin: number;
}

export type RouteResult =
  | { ok: true; route: RoadRoute }
  | { ok: false; reason: "no-token" | "no-route" | "failed" };

const cache = new Map<string, RouteResult>();
const k = (p: LatLng) => `${p.lng.toFixed(4)},${p.lat.toFixed(4)}`;

export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<RouteResult> {
  if (!MAPBOX_TOKEN) return { ok: false, reason: "no-token" };
  const key = `${k(from)};${k(to)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const r = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${key}` +
        `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`,
      { signal },
    );
    if (!r.ok) return { ok: false, reason: "failed" };
    const d = (await r.json()) as {
      routes?: { geometry: { coordinates: LngLat[] }; distance: number; duration: number }[];
    };
    const best = d.routes?.[0];
    if (!best) {
      const res: RouteResult = { ok: false, reason: "no-route" };
      cache.set(key, res);
      return res;
    }
    const res: RouteResult = {
      ok: true,
      route: {
        geometry: best.geometry.coordinates,
        distanceKm: best.distance / 1000,
        durationMin: Math.round(best.duration / 60),
      },
    };
    cache.set(key, res);
    return res;
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/** "1 h 25 min" / "40 min". */
export function formatDuration(min: number): string {
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
