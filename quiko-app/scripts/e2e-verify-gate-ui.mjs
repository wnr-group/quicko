// The traveller-side halves of the rule, through the real UI:
//   1. an unverified traveller sees "Verify your identity to carry", not an offer button
//   2. an unverified traveller cannot ACCEPT a request either (the money path)
import postgres from "postgres";
import { SignJWT } from "jose";
import { chromium } from "playwright";

process.loadEnvFile(".env.local");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const BASE = "http://localhost:3000";
const SENDER_ID = "aaaaaaaa-0000-4000-8000-000000000002";
const TRAVELER_ID = "11111111-1111-1111-1111-111111111111";
const TRAVELER_PHONE = "919000000001";

let pass = 0; const fails = [];
const check = (n, c, d = "") => c ? (pass++, console.log(`  ✓ ${n}`)) : (fails.push(n), console.log(`  ✗ ${n}${d ? ` — ${d}` : ""}`));
const setKyc = (lvl) => sql`update profiles set kyc_level = ${lvl} where id = ${TRAVELER_ID}`;

let browser;
try {
  const original = (await sql`select kyc_level from profiles where id = ${TRAVELER_ID}`)[0].kyc_level;
  await sql`delete from profiles where id = ${SENDER_ID}`;
  await sql`insert into profiles (id, phone, full_name, kyc_level) values (${SENDER_ID}, '919888800099', 'Gate UI Sender', 3)`;
  const [trip] = await sql`select * from trips where traveler_id = ${TRAVELER_ID} and status='active' limit 1`;
  // The seeded trip date drifts into the past; explorePackages needs the trip on
  // or after the package's travel date, and new packages are always dated today.
  const tripDate = trip.travel_date;
  await sql`update trips set travel_date = current_date where id = ${trip.id}`;

  // A request from the sender, created while the traveller was still verified.
  await setKyc(3);
  const tok = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(SENDER_ID).setIssuedAt().setExpirationTime("30d").sign(key);
  await fetch(`${BASE}/api/packages`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${tok}` },
    body: JSON.stringify({
      fromLabel: "Madurai", fromLat: trip.from_lat, fromLng: trip.from_lng,
      toLabel: "Coimbatore", toLat: trip.to_lat, toLng: trip.to_lng,
      weightKg: 2, description: "accept gate test", tripId: trip.id,
    }),
  });
  // A second package with NO request on it, so the traveller's browse list has
  // something to show — explorePackages hides anything this trip already asked for.
  await fetch(`${BASE}/api/packages`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${tok}` },
    body: JSON.stringify({
      fromLabel: "Madurai", fromLat: trip.from_lat, fromLng: trip.from_lng,
      toLabel: "Coimbatore", toLat: trip.to_lat, toLng: trip.to_lng,
      weightKg: 1, description: "browsable package",
    }),
  });
  // …and now their verification no longer stands.
  await setKyc(1);

  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(20000);
  await page.goto(`${BASE}/login`);
  await page.locator('input[inputmode="tel"]').fill(`+${TRAVELER_PHONE}`);
  await page.getByRole("button", { name: "Send Code" }).click();
  await page.locator('input[inputmode="numeric"]').fill(process.env.DEV_OTP);
  await page.getByRole("button", { name: "Verify & Continue" }).click();
  await page.waitForURL("**/app**");

  console.log("\nTraveller -> sender (offer to carry), traveller unverified");
  await page.goto(`${BASE}/app/travel/trips/${trip.id}/packages`);
  const verifyCta = page.getByRole("link", { name: /Verify your identity to carry/i });
  const offerCta = page.getByRole("button", { name: /Offer to carry/i });
  check("offer button is replaced by a verify prompt", await verifyCta.count() > 0);
  check("  …no offer button is reachable", await offerCta.count() === 0);
  if (await verifyCta.count()) {
    await verifyCta.first().click();
    await page.waitForURL("**/app/verify");
    check("  …and it leads to the verification page", page.url().endsWith("/app/verify"));
  }

  console.log("\nAccepting a pending request, traveller unverified");
  await page.goto(`${BASE}/app/travel/trips/${trip.id}`);
  await page.getByRole("button", { name: "Accept" }).first().click();
  await page.getByText(/Verify your identity before you can carry/i).first().waitFor();
  check("accept is refused with the verification reason", true);
  const madeMatch = (await sql`select count(*)::int c from matches where traveler_id = ${TRAVELER_ID} and sender_id = ${SENDER_ID}`)[0].c;
  check("  …and NO match was created", madeMatch === 0, `${madeMatch} match(es)`);

  console.log("\nSame request, once verified");
  await setKyc(3);
  await page.reload();
  await page.getByRole("button", { name: "Accept" }).first().click();
  await page.getByText(/it.s a match|Waiting for|Payment secured/i).first().waitFor();
  const nowMatch = (await sql`select count(*)::int c from matches where traveler_id = ${TRAVELER_ID} and sender_id = ${SENDER_ID}`)[0].c;
  check("accept now succeeds", nowMatch === 1, `${nowMatch} match(es)`);

  await sql`delete from transactions where match_id in (select id from matches where sender_id = ${SENDER_ID})`;
  await sql`delete from profiles where id = ${SENDER_ID}`;
  await sql`update trips set status='active', travel_date = ${tripDate} where id = ${trip.id}`;
  await setKyc(original);
  console.log(`\n${fails.length ? "❌" : "✅"} ${pass} passed, ${fails.length} failed`);
  if (fails.length) process.exitCode = 1;
} catch (e) {
  console.error("\n💥", e.message); process.exitCode = 1;
} finally { await browser?.close(); await sql.end(); }
