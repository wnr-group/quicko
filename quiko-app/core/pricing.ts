import type { TimePreference } from "./types";

// Quiko pricing model:
//
//   Max = (₹170 flat + distance charge + weight surcharge) × speed multiplier
//     distance: first 200 km × ₹1.20/km, each km beyond × ₹0.20/km
//     weight:   ≤1kg ₹0 · ≤2kg ₹20 · ≤5kg ₹50 · >5kg ₹50 + ₹20/kg over 5
//     speed:    same-day costs more, flexible is cheapest
//
// Declared value does NOT affect price (it sets the traveler's liability cap).

export const FLAT_BASE = 170;
export const NEAR_KM = 200;
export const NEAR_RATE = 1.2; // ₹/km for the first 200 km
export const FAR_RATE = 0.2; // ₹/km beyond 200 km

// The sooner it must arrive, the higher the price.
export const TIME_MULTIPLIERS: Record<TimePreference, number> = {
  same_day: 1.5,
  next_day: 1.2,
  flexible: 1.0,
};

/** Distance component: first 200 km priced higher, the long tail cheaper. */
export function distanceCharge(distanceKm: number): number {
  const near = Math.min(distanceKm, NEAR_KM) * NEAR_RATE;
  const far = Math.max(0, distanceKm - NEAR_KM) * FAR_RATE;
  return near + far;
}

/** Tiered weight surcharge. */
export function weightSurcharge(weightKg: number): number {
  if (weightKg <= 1) return 0;
  if (weightKg <= 2) return 20;
  if (weightKg <= 5) return 50;
  return 50 + (weightKg - 5) * 20;
}

export interface PriceInput {
  weightKg: number;
  distanceKm: number;
  timePreference: TimePreference;
}

export interface PriceBreakdown {
  base: number;
  distanceComponent: number;
  weightComponent: number;
  maxPrice: number; // rounded ₹
}

/** Compute the recommended max price plus a breakdown for the UI. */
export function calculatePrice(input: PriceInput): PriceBreakdown {
  const dist = distanceCharge(input.distanceKm);
  const weight = weightSurcharge(input.weightKg);
  const subtotal = FLAT_BASE + dist + weight;
  const maxPrice = subtotal * TIME_MULTIPLIERS[input.timePreference];

  return {
    base: FLAT_BASE,
    distanceComponent: Math.round(dist),
    weightComponent: weight,
    maxPrice: Math.round(maxPrice),
  };
}

// ---- Traveller detour ("travel an extra mile to earn more") ----
// Every trip includes a free 2 km detour. Beyond that, a traveller who opts in
// (up to +10 km willingness) earns ₹20 per extra km of ACTUAL detour a package
// adds to their route. See geo.detourKm for how the distance is measured.
export const FREE_DETOUR_KM = 2;
export const DETOUR_RATE = 20; // ₹ per km beyond the free 2 km
export const MAX_EXTRA_DETOUR_KM = 10; // slider cap the traveller can offer

/** Door-service fee for a given actual detour (₹0 within the free 2 km). */
export function detourFee(detourKm: number): number {
  return Math.max(0, Math.round(detourKm) - FREE_DETOUR_KM) * DETOUR_RATE;
}

export const QUIKO_COMMISSION_RATE = 0.02; // 2%

/** Split a price into what the traveler earns vs Quiko's commission. */
export function splitPayment(amount: number) {
  const commission = Math.round(amount * QUIKO_COMMISSION_RATE * 100) / 100;
  return { travelerEarns: Math.round((amount - commission) * 100) / 100, commission };
}
