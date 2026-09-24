import type { TimePreference } from "./types";

// Quiko pricing model (Studio Forge framework):
//
//   Final Price = (Distance + Platform Fee + Weight) × Service Multiplier
//   A per-match detour charge is added on top once a specific trip is chosen
//   (the detour is only known when a traveller is matched — see matchDetour).
//
//     distance: progressive slabs — short-haul dear, long tail cheap
//     platform: flat ₹60 (matching, verification, escrow, comms, tracking, support)
//     weight:   internal range; the low end is taken so senders don't feel overcharged
//     service:  Flexible ×0.65 · Standard ×1.00 · Fast ×1.10 · Express ×1.30
//
// Declared value does NOT affect price (it sets the traveler's liability cap).

export const PLATFORM_FEE = 60; // flat, added to the distance component

// Progressive distance slabs: each portion of the route is charged at the rate
// for its band, so crossing into a cheaper band never re-prices the whole trip.
const DISTANCE_SLABS: { upto: number; rate: number }[] = [
  { upto: 50, rate: 2.0 },
  { upto: 150, rate: 1.6 },
  { upto: 300, rate: 1.0 },
  { upto: 600, rate: 0.65 },
  { upto: 1000, rate: 0.5 },
  { upto: Infinity, rate: 0.4 },
];

/** Distance component, charged progressively across the slabs above. */
export function distanceCharge(distanceKm: number): number {
  let remaining = Math.max(0, distanceKm);
  let prev = 0;
  let total = 0;
  for (const { upto, rate } of DISTANCE_SLABS) {
    if (remaining <= 0) break;
    const band = Math.min(remaining, upto - prev);
    total += band * rate;
    remaining -= band;
    prev = upto;
  }
  return total;
}

// Internal weight charge. The framework defines a RANGE per tier; we take the
// low end (sender affordability first). Kept as a table so it stays easy to tune.
const WEIGHT_CHARGES: { upto: number; charge: number }[] = [
  { upto: 2, charge: 0 },
  { upto: 5, charge: 30 },
  { upto: 10, charge: 70 },
  { upto: 20, charge: 120 },
  // >20 kg is "custom review"; parcels are validated to ≤15 kg, so this is a
  // safe ceiling rather than a reachable tier.
  { upto: Infinity, charge: 200 },
];

/** Tiered weight surcharge (low end of each framework range). */
export function weightCharge(weightKg: number): number {
  for (const { upto, charge } of WEIGHT_CHARGES) {
    if (weightKg <= upto) return charge;
  }
  return 200;
}

// Service levels set the final multiplier. Flexible gives a 35% discount to
// price-sensitive senders willing to wait for a matching journey.
export type ServiceLevel = "flexible" | "standard" | "fast" | "express";

export const SERVICE_MULTIPLIERS: Record<ServiceLevel, number> = {
  flexible: 0.65,
  standard: 1.0,
  fast: 1.1,
  express: 1.3,
};

// Until the sender UI exposes the four service levels (PR-2), the existing
// urgency control maps onto them, preserving price order (cheapest → dearest):
//   flexible → Flexible · next_day → Standard · same_day → Express
const TIME_TO_SERVICE: Record<TimePreference, ServiceLevel> = {
  flexible: "flexible",
  next_day: "standard",
  same_day: "express",
};

export interface PriceInput {
  weightKg: number;
  distanceKm: number;
  timePreference: TimePreference;
}

export interface PriceBreakdown {
  platformFee: number;
  distanceComponent: number;
  weightComponent: number;
  serviceMultiplier: number;
  maxPrice: number; // rounded ₹
}

/** Compute the recommended max price plus a breakdown for the UI. */
export function calculatePrice(input: PriceInput): PriceBreakdown {
  const dist = distanceCharge(input.distanceKm);
  const weight = weightCharge(input.weightKg);
  const multiplier = SERVICE_MULTIPLIERS[TIME_TO_SERVICE[input.timePreference]];
  const preService = PLATFORM_FEE + dist + weight;
  const maxPrice = preService * multiplier;

  return {
    platformFee: PLATFORM_FEE,
    distanceComponent: Math.round(dist),
    weightComponent: weight,
    serviceMultiplier: multiplier,
    maxPrice: Math.round(maxPrice),
  };
}

// ---- Traveller detour ("travel an extra mile to earn more") ----
// Every trip includes a free 2 km detour. Beyond that, a traveller who opts in
// earns a door-service fee for the ACTUAL detour a package adds to their route.
// See geo.detourKm for how the distance is measured.
//
// Priced on the Studio Forge framework's proportional slab table (§12): the
// charge scales linearly WITHIN a band — fee = bandMax × actualKm / bandUpperKm.
// e.g. a 4 km detour sits in the 2–5 km band → 40 × 4 / 5 = ₹32.
const DETOUR_SLABS: { upto: number; max: number }[] = [
  { upto: 2, max: 0 }, // free
  { upto: 5, max: 40 },
  { upto: 8, max: 60 },
  { upto: 12, max: 80 },
  { upto: 15, max: 100 },
  { upto: 18, max: 130 },
  { upto: 24, max: 160 },
];

export const FREE_DETOUR_KM = 2;
export const MAX_EXTRA_DETOUR_KM = 10; // slider cap the traveller can offer (extra km beyond free)

/** Door-service fee for a given actual detour (₹0 within the free 2 km). */
export function detourFee(detourKm: number): number {
  const km = Math.round(detourKm);
  if (km <= FREE_DETOUR_KM) return 0;
  for (const { upto, max } of DETOUR_SLABS) {
    if (km <= upto) return Math.round((max * km) / upto);
  }
  // Beyond the table's 24 km ceiling: hold at the top band's proportional rate.
  const top = DETOUR_SLABS[DETOUR_SLABS.length - 1];
  return Math.round((top.max * km) / top.upto);
}

export const QUIKO_COMMISSION_RATE = 0.1; // 10%

/** Split a price into what the traveler earns vs Quiko's commission. */
export function splitPayment(amount: number) {
  const commission = Math.round(amount * QUIKO_COMMISSION_RATE * 100) / 100;
  return { travelerEarns: Math.round((amount - commission) * 100) / 100, commission };
}
