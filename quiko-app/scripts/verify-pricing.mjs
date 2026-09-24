// Acceptance check for the Studio Forge pricing engine (PR-1).
// Run: node scripts/verify-pricing.mjs   (needs a Node that strips TS types)
//
// Two things are verified separately and honestly:
//   1. What the ENGINE quotes today — calculatePrice(...), no detour.
//   2. The spec's §13 FULL target — which includes a ₹32 proportional detour the
//      engine does NOT yet produce (detour is still linear ₹20/km; that slab
//      table lands in PR-2). Those lines are asserted against the multiplier
//      applied to the spec's stated pre-service (₹669.80), NOT against the
//      engine, so nobody mistakes ₹435 for what the app currently charges.
import {
  calculatePrice,
  distanceCharge,
  weightCharge,
  PLATFORM_FEE,
  SERVICE_MULTIPLIERS,
  splitPayment,
} from "../core/pricing.ts";

let fail = 0;
const near = (got, want, label, tol = 0.01) => {
  const ok = Math.abs(got - want) <= tol;
  console.log(`${ok ? "✓" : "✗"} ${label}: got ${got}, want ${want}`);
  if (!ok) fail++;
};

// ── Components (spec §7, §9, §11) ──────────────────────────────────────────
near(distanceCharge(512), 547.8, "distance(512 km) = ₹547.80");
near(distanceCharge(50), 100, "distance(50) = ₹100");
near(distanceCharge(150), 260, "distance(150) = ₹260 (100 + 100×1.6)");
near(distanceCharge(300), 410, "distance(300) = ₹410 (260 + 150×1.0)");
near(distanceCharge(0), 0, "distance(0) = ₹0");
near(PLATFORM_FEE, 60, "platform fee = ₹60");
near(weightCharge(2), 0, "weight(2 kg) = ₹0");
near(weightCharge(3), 30, "weight(3 kg) = ₹30");
near(weightCharge(8), 70, "weight(8 kg) = ₹70");
near(weightCharge(15), 120, "weight(15 kg) = ₹120");

// ── Engine composition — what the app quotes TODAY (512 km, 3 kg, no detour) ──
// pre-service = 60 + 547.80 + 30 = 637.80, then × service multiplier.
near(calculatePrice({ distanceKm: 512, weightKg: 3, timePreference: "flexible" }).maxPrice, 415, "engine flexible (×0.65) = ₹415");
near(calculatePrice({ distanceKm: 512, weightKg: 3, timePreference: "next_day" }).maxPrice, 638, "engine next_day/Standard (×1.0) = ₹638");
near(calculatePrice({ distanceKm: 512, weightKg: 3, timePreference: "same_day" }).maxPrice, 829, "engine same_day/Express (×1.3) = ₹829");

// ── Multiplier constants match the spec's four tiers ──
near(SERVICE_MULTIPLIERS.flexible, 0.65, "multiplier Flexible = 0.65");
near(SERVICE_MULTIPLIERS.standard, 1.0, "multiplier Standard = 1.00");
near(SERVICE_MULTIPLIERS.fast, 1.1, "multiplier Fast = 1.10");
near(SERVICE_MULTIPLIERS.express, 1.3, "multiplier Express = 1.30");

// ── Spec §13 FULL target (incl. ₹32 detour) — PR-2 goal, NOT yet engine output ──
const specPreService = 669.8; // spec's 637.80 + ₹32 proportional detour
near(Math.round(specPreService * SERVICE_MULTIPLIERS.flexible), 435, "[PR-2 target, incl detour] Flexible ₹435");
near(Math.round(specPreService * SERVICE_MULTIPLIERS.standard), 670, "[PR-2 target, incl detour] Standard ₹670");
near(Math.round(specPreService * SERVICE_MULTIPLIERS.fast), 737, "[PR-2 target, incl detour] Fast ₹737");
near(Math.round(specPreService * SERVICE_MULTIPLIERS.express), 871, "[PR-2 target, incl detour] Express ₹871");

// ── Commission (spec §8): 10%, ₹500 gross → ₹450 earn / ₹50 commission ──
const split = splitPayment(500);
near(split.travelerEarns, 450, "traveller earns (₹500 gross) = ₹450");
near(split.commission, 50, "commission (₹500 gross) = ₹50");

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
