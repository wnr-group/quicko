// Integration test for the pickup OTP gate.
//
// Drives the REAL code paths: the package + request are created through the
// JSON API, the accept (which mints the OTPs) through the traveller's actual
// UI, and every pickup attempt through POST /api/matches/[id]/advance. The DB
// is inspected between steps to prove the match status really did / didn't move.
//
// Needs: dev server on :3000, postgres up, seeded travellers (npm run db:seed).
import postgres from "postgres";
import { SignJWT } from "jose";
import { chromium } from "playwright";

process.loadEnvFile(".env.local");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const BASE = "http://localhost:3000";

const SENDER_ID = "aaaaaaaa-0000-4000-8000-00000000cafe";
const SENDER_PHONE = "919888800077";
const TRAVELER_ID = "11111111-1111-1111-1111-111111111111"; // Raj Kumar (seed)
const TRAVELER_PHONE = "919000000001";

let pass = 0;
const fails = [];
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fails.push(name); console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
}

const token = (id) =>
  new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(id)
    .setIssuedAt().setExpirationTime("30d").sign(key);

async function apiPost(path, tok, body) {
  const r = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${tok}` },
    body: JSON.stringify(body ?? {}),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
async function apiGet(path, tok) {
  const r = await fetch(`${BASE}/api${path}`, { headers: { authorization: `Bearer ${tok}` } });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const statusOf = async (id) =>
  (await sql`select status from matches where id = ${id}`)[0]?.status;

let browser;
try {
  // ---- Fixture: a clean sender + one live trip to request -------------------
  await sql`delete from profiles where id = ${SENDER_ID}`;
  await sql`
    insert into profiles (id, phone, full_name, email, kyc_level)
    values (${SENDER_ID}, ${SENDER_PHONE}, 'OTP Test Sender', 'otp@test.local', 3)
  `;
  const [trip] = await sql`
    select id, from_lat, from_lng, to_lat, to_lng from trips
    where traveler_id = ${TRAVELER_ID} and status = 'active' limit 1
  `;
  if (!trip) throw new Error("No active seeded trip — run `npm run db:seed`");

  const senderTok = await token(SENDER_ID);
  const travelerTok = await token(TRAVELER_ID);

  // ---- 1. Sender creates a package + request (real API) ---------------------
  const created = await apiPost("/packages", senderTok, {
    fromLabel: "T. Nagar, Chennai", fromLat: trip.from_lat, fromLng: trip.from_lng,
    toLabel: "Andheri, Mumbai", toLat: trip.to_lat, toLng: trip.to_lng,
    weightKg: 2, description: "pickup otp test", tripId: trip.id,
  });
  if (!created.body?.id) throw new Error(`Package create failed: ${JSON.stringify(created)}`);
  const packageId = created.body.id;
  console.log(`\nFixture: package ${packageId.slice(0, 8)} → trip ${trip.id.slice(0, 8)}`);

  // ---- 2. Traveller accepts through the real UI (mints the OTPs) ------------
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(20000);
  await page.goto(`${BASE}/login`);
  await page.locator('input[inputmode="tel"]').fill(`+${TRAVELER_PHONE}`);
  await page.getByRole("button", { name: "Send Code" }).click();
  await page.locator('input[inputmode="numeric"]').fill(process.env.DEV_OTP);
  await page.getByRole("button", { name: "Verify & Continue" }).click();
  await page.waitForURL("**/app**");
  await page.goto(`${BASE}/app/travel/trips/${trip.id}`);
  await page.getByRole("button", { name: "Accept" }).first().click();
  await page.getByText(/it.s a match|Waiting for|Payment secured/i).first().waitFor();
  console.log("Traveller accepted via UI\n");

  const [match] = await sql`
    select id, pickup_otp, delivery_otp, status from matches
    where package_id = ${packageId} order by created_at desc limit 1
  `;
  if (!match) throw new Error("Accept did not create a match");
  const matchId = match.id;

  // ---- Minting -------------------------------------------------------------
  console.log("Minting");
  check("pickup OTP is minted on accept", /^\d{4}$/.test(match.pickup_otp ?? ""),
    `got ${JSON.stringify(match.pickup_otp)}`);
  check("delivery OTP still minted", /^\d{4}$/.test(match.delivery_otp ?? ""));
  check("the two codes are independent", match.pickup_otp !== match.delivery_otp,
    "same value for both");

  const good = match.pickup_otp;
  const wrong = String((Number(good) + 1) % 10000).padStart(4, "0");

  // ---- Exposure ------------------------------------------------------------
  console.log("\nExposure");
  await apiPost(`/matches/${matchId}/pay`, senderTok);
  check("match is paid (pickup now reachable)", (await statusOf(matchId)) === "paid");

  const asSender = await apiGet(`/matches/${matchId}`, senderTok);
  const asTraveler = await apiGet(`/matches/${matchId}`, travelerTok);
  check("sender is given the pickup OTP", asSender.body.pickupOtp === good,
    `got ${JSON.stringify(asSender.body.pickupOtp)}`);
  check("traveller is NOT given the pickup OTP", asTraveler.body.pickupOtp === "",
    `got ${JSON.stringify(asTraveler.body.pickupOtp)}`);
  check("traveller is NOT given the delivery OTP", asTraveler.body.otp === "");

  // ---- The gate ------------------------------------------------------------
  console.log("\nGate");
  const noOtp = await apiPost(`/matches/${matchId}/advance`, travelerTok, { to: "picked_up" });
  check("pickup with NO OTP is rejected", noOtp.status === 400,
    `status ${noOtp.status}`);
  check("  …still 'paid' after the empty attempt", (await statusOf(matchId)) === "paid");

  const badOtp = await apiPost(`/matches/${matchId}/advance`, travelerTok, { to: "picked_up", otp: wrong });
  check("pickup with a WRONG OTP is rejected", badOtp.status === 400);
  check("  …with the right message", badOtp.body.error === "Incorrect pickup OTP",
    `got ${JSON.stringify(badOtp.body.error)}`);
  check("  …still 'paid' after the wrong attempt", (await statusOf(matchId)) === "paid");

  const spaced = await apiPost(`/matches/${matchId}/advance`, travelerTok, { to: "picked_up", otp: ` ${good} ` });
  check("whitespace around a correct OTP is tolerated", spaced.status === 200,
    `status ${spaced.status} ${JSON.stringify(spaced.body)}`);
  check("  …match advanced to 'picked_up'", (await statusOf(matchId)) === "picked_up");

  // ---- Wrong hands ---------------------------------------------------------
  console.log("\nAuthorisation");
  await sql`update matches set status = 'paid' where id = ${matchId}`;
  const bySender = await apiPost(`/matches/${matchId}/advance`, senderTok, { to: "picked_up", otp: good });
  check("the sender cannot confirm pickup themselves", bySender.status === 400,
    `status ${bySender.status}`);
  check("  …still 'paid'", (await statusOf(matchId)) === "paid");

  // ---- Legacy matches (no pickup OTP on the row) ---------------------------
  console.log("\nLegacy rows");
  await sql`update matches set pickup_otp = null where id = ${matchId}`;
  const legacy = await apiPost(`/matches/${matchId}/advance`, travelerTok, { to: "picked_up" });
  check("a pre-existing match with no pickup OTP still advances", legacy.status === 200,
    `status ${legacy.status} ${JSON.stringify(legacy.body)}`);
  check("  …match advanced to 'picked_up'", (await statusOf(matchId)) === "picked_up");

  // ---- Delivery OTP unaffected --------------------------------------------
  console.log("\nDelivery (regression)");
  await apiPost(`/matches/${matchId}/advance`, travelerTok, { to: "in_transit" });
  check("in_transit needs no OTP", (await statusOf(matchId)) === "in_transit");
  const badDel = await apiPost(`/matches/${matchId}/deliver`, travelerTok, { otp: wrong });
  check("delivery with a wrong OTP still rejected", badDel.status === 400 && badDel.body.error === "Incorrect OTP");
  const okDel = await apiPost(`/matches/${matchId}/deliver`, travelerTok, { otp: match.delivery_otp });
  check("delivery with the correct OTP still works", okDel.status === 200,
    `status ${okDel.status} ${JSON.stringify(okDel.body)}`);

  // ---- Cleanup -------------------------------------------------------------
  // transactions.from_profile/to_profile have no ON DELETE rule, so the escrow
  // + payout rows must go before the profile they point at.
  await sql`delete from transactions where match_id = ${matchId}`;
  await sql`delete from profiles where id = ${SENDER_ID}`; // cascades package/match
  await sql`update trips set status = 'active' where id = ${trip.id}`;
  await sql`
    update profiles set deliveries_count = greatest(deliveries_count - 1, 0)
    where id = ${TRAVELER_ID}
  `; // the completed test delivery incremented the seeded traveller's count

  console.log(`\n${fails.length ? "❌" : "✅"} ${pass} passed, ${fails.length} failed`);
  if (fails.length) { fails.forEach((f) => console.log(`   - ${f}`)); process.exitCode = 1; }
} catch (err) {
  console.error("\n💥 Harness error:", err.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await sql.end();
}
