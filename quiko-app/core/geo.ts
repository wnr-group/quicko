// Geographic helpers — pure, framework-agnostic (reused by web + future RN).

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PinnedLocation extends LatLng {
  label: string;
}

const EARTH_R = 6371; // km
const ROAD_FACTOR = 1.3; // straight-line → approx driving distance

const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance between two points, in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Approx road distance used for pricing (straight-line × road factor). */
export function roadDistanceKm(a: LatLng, b: LatLng): number {
  return Math.round(haversineKm(a, b) * ROAD_FACTOR);
}

/** Are two points within `km` of each other? (used for route matching) */
export function isNear(a: LatLng, b: LatLng, km: number): boolean {
  return haversineKm(a, b) <= km;
}

// Route-match radii: a package fits a trip when its pickup is within 15 km of
// the trip's start and its drop within 20 km of the trip's end.
export const PICKUP_RADIUS_KM = 15;
export const DROP_RADIUS_KM = 20;

/**
 * Symmetric route match. The SAME rule decides visibility for both sides —
 * a sender browsing trips, and (P2) a traveler browsing packages.
 */
export function routeMatches(
  pkgFrom: LatLng,
  pkgTo: LatLng,
  tripFrom: LatLng,
  tripTo: LatLng,
): boolean {
  return (
    isNear(pkgFrom, tripFrom, PICKUP_RADIUS_KM) &&
    isNear(pkgTo, tripTo, DROP_RADIUS_KM)
  );
}

/**
 * Extra distance a package adds to a trip, summed across both ends — how far
 * the pickup sits off the trip's start plus how far the drop sits off the trip's
 * end. Straight-line proxy (no routing engine); slightly generous to the sender.
 */
export function detourKm(
  tripFrom: LatLng,
  pickup: LatLng,
  drop: LatLng,
  tripTo: LatLng,
): number {
  return roadDistanceKm(tripFrom, pickup) + roadDistanceKm(drop, tripTo);
}

export type DetourTier = "free" | "payable" | "self_collect";

/**
 * Which service tier a detour falls into, given the traveller's willingness
 * (extra km beyond the free 2 km). free → no fee; payable → door-service with a
 * fee the sender may decline; self_collect → beyond willingness, meet on-route.
 */
export function detourTier(km: number, extraDetourKm: number): DetourTier {
  const FREE = 2;
  if (Math.round(km) <= FREE) return "free";
  if (Math.round(km) <= FREE + extraDetourKm) return "payable";
  return "self_collect";
}

// Metro centroids — default pins and quick-pick suggestions.
export const CITY_COORDS: Record<string, LatLng> = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
};
