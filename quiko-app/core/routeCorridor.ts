// Route-corridor geometry — pure and framework-agnostic (no Mapbox, no DOM).
//
// Plain proximity (core/geo.ts routeMatches) only compares endpoints. A pickup
// that is 3 km from a road the traveller never drives is not on their route, so
// this module measures against the actual route line and checks direction.

import type { LatLng } from "./geo";

/** [lng, lat] pairs — the GeoJSON order Mapbox Directions returns. */
export type LngLat = [number, number];

const toRad = (d: number) => (d * Math.PI) / 180;

/** Project to a local flat plane (km) around `origin` — fine at corridor scale. */
function toPlane(p: LatLng, origin: LatLng): [number, number] {
  const x = (p.lng - origin.lng) * Math.cos(toRad(origin.lat)) * 111.32;
  const y = (p.lat - origin.lat) * 110.57;
  return [x, y];
}

export interface RouteProjection {
  /** Shortest distance from the point to the route line, km. */
  offRouteKm: number;
  /** Distance travelled along the route to the closest point, km. */
  alongKm: number;
}

/** Closest approach of `point` to the polyline, and how far along it that is. */
export function projectOntoRoute(route: LngLat[], point: LatLng): RouteProjection | null {
  if (route.length < 2) return null;
  const origin = point;
  const p: [number, number] = [0, 0];
  let best = Infinity;
  let bestAlong = 0;
  let travelled = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = toPlane({ lng: route[i][0], lat: route[i][1] }, origin);
    const b = toPlane({ lng: route[i + 1][0], lat: route[i + 1][1] }, origin);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    const cx = a[0] + t * dx;
    const cy = a[1] + t * dy;
    const d = Math.hypot(p[0] - cx, p[1] - cy);
    const segLen = Math.sqrt(len2);
    if (d < best) {
      best = d;
      bestAlong = travelled + t * segLen;
    }
    travelled += segLen;
  }
  return { offRouteKm: best, alongKm: bestAlong };
}

/** Default corridor half-width: how far off the road a stop may sit. */
export const CORRIDOR_KM = 3;

export interface CorridorFit {
  pickupOffKm: number;
  dropOffKm: number;
  /** Pickup comes before drop in the direction the traveller is going. */
  ordered: boolean;
  /** Both stops within the corridor AND in travel order. */
  onRoute: boolean;
}

/**
 * Does a package's pickup→drop lie along a traveller's route, in order?
 * Close-by is not enough: a drop *behind* the pickup (relative to the traveller's
 * direction) is not deliverable on this trip, however near it is.
 */
export function corridorFit(
  route: LngLat[],
  pickup: LatLng,
  drop: LatLng,
  corridorKm = CORRIDOR_KM,
): CorridorFit | null {
  const a = projectOntoRoute(route, pickup);
  const b = projectOntoRoute(route, drop);
  if (!a || !b) return null;
  const ordered = b.alongKm > a.alongKm;
  return {
    pickupOffKm: a.offRouteKm,
    dropOffKm: b.offRouteKm,
    ordered,
    onRoute: ordered && a.offRouteKm <= corridorKm && b.offRouteKm <= corridorKm,
  };
}

/** Bounding box [[minLng, minLat], [maxLng, maxLat]] of points, or null if none. */
export function boundsOf(points: LatLng[]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const p of points) {
    minLng = Math.min(minLng, p.lng); maxLng = Math.max(maxLng, p.lng);
    minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat);
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}

