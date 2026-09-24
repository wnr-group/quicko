// Acceptance check: the pricing engine must reproduce the Studio Forge
// framework's own worked example (§13, Coimbatore → Chennai, 512 km).
// Run: node scripts/verify-pricing.mjs
import {
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

// Step 1 — progressive distance charge for 512 km
near(distanceCharge(512), 547.8, "distance(512 km) = ₹547.80");
// slab boundaries
near(distanceCharge(50), 100, "distance(50) = ₹100");
near(distanceCharge(150), 260, "distance(150) = ₹260 (100 + 100×1.6)");
near(distanceCharge(300), 410, "distance(300) = ₹410 (260 + 150×1.0)");

// Step 2/3 — platform fee + weight (2.1–5 kg → ₹30 low end)
near(PLATFORM_FEE, 60, "platform fee = ₹60");
near(weightCharge(3), 30, "weight(3 kg) = ₹30");
near(weightCharge(2), 0, "weight(2 kg) = ₹0");
near(weightCharge(8), 70, "weight(8 kg) = ₹70");

// Pre-service (excluding detour) = 547.80 + 60 + 30
const preServiceNoDetour = distanceCharge(512) + PLATFORM_FEE + weightCharge(3);
near(preServiceNoDetour, 637.8, "pre-service (no detour) = ₹637.80");

// Step 5 — service multipliers applied to the doc's full pre-service (incl.
// its ₹32 detour) = ₹669.80. Verifies the four multipliers reproduce the table.
const preService = 669.8;
near(Math.round(preService * SERVICE_MULTIPLIERS.flexible), 435, "Flexible ≈ ₹435");
near(Math.round(preService * SERVICE_MULTIPLIERS.standard), 670, "Standard ≈ ₹670");
near(Math.round(preService * SERVICE_MULTIPLIERS.fast), 737, "Fast ≈ ₹737");
near(Math.round(preService * SERVICE_MULTIPLIERS.express), 871, "Express ≈ ₹871");

// §8 — 10% commission example: gross ₹500 → earn ₹450, commission ₹50
const split = splitPayment(500);
near(split.travelerEarns, 450, "traveller earns (₹500 gross) = ₹450");
near(split.commission, 50, "commission (₹500 gross) = ₹50");

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
