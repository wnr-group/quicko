// One trip carries several packages, bounded by REMAINING capacity.
//   4 kg + 4 kg fit a 10 kg trip; a third 4 kg package does not.
//   The trip stays discoverable while it has room, and closes when full.
//   Cancelling a match gives the space back.
import postgres from "postgres";
import { SignJWT } from "jose";
import { chromium } from "playwright";

process.loadEnvFile(".env.local");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const BASE = "http://localhost:3000";
const S = "aaaaaaaa-0000-4000-8000-000000000004";
const T = "11111111-1111-1111-1111-111111111111";

let pass = 0; const fails = [];
const check = (n, c, d = "") => c ? (pass++, console.log(`  ✓ ${n}`)) : (fails.push(n), console.log(`  ✗ ${n}${d ? ` — ${d}` : ""}`));

let browser;
try {
  const [trip] = await sql`select * from trips where traveler_id = ${T} limit 1`;
  const tripDate = trip.travel_date, cap = trip.capacity_kg;
  await sql`update trips set travel_date = current_date, status = 'active' where id = ${trip.id}`;
  await sql`update profiles set kyc_level = 3 where id = ${T}`;
  await sql`delete from profiles where id = ${S}`;
  await sql`insert into profiles (id, phone, full_name, kyc_level) values (${S},'919888800122','Capacity Sender',3)`;
  const tok = await new SignJWT({}).setProtectedHeader({alg:"HS256"}).setSubject(S).setIssuedAt().setExpirationTime("30d").sign(key);

  const mk = (kg, withTrip) => fetch(`${BASE}/api/packages`, {
    method:"POST", headers:{"content-type":"application/json",authorization:`Bearer ${tok}`},
    body: JSON.stringify({ fromLabel:"Madurai",fromLat:trip.from_lat,fromLng:trip.from_lng,
      toLabel:"Coimbatore",toLat:trip.to_lat,toLng:trip.to_lng, weightKg:kg,
      description:`${kg}kg`, ...(withTrip ? { tripId: trip.id } : {}) }),
  }).then(async r => ({ status: r.status, body: await r.json().catch(()=>({})) }));

  const carried = async () => Number((await sql`
    select coalesce(sum(p.weight_kg),0)::float w from matches m
    join packages p on p.id=m.package_id where m.trip_id=${trip.id} and m.status<>'cancelled'`)[0].w);
  const tripStatus = async () => (await sql`select status from trips where id=${trip.id}`)[0].status;
  const matchCount = async () => (await sql`select count(*)::int c from matches where trip_id=${trip.id} and status<>'cancelled'`)[0].c;

  browser = await chromium.launch({ channel:"chrome", headless:true });
  const page = await browser.newPage({ viewport:{width:390,height:844} });
  page.setDefaultTimeout(20000);
  await page.goto(`${BASE}/login`);
  await page.locator('input[inputmode="tel"]').fill("+919000000001");
  await page.getByRole("button",{name:"Send Code"}).click();
  await page.locator('input[inputmode="numeric"]').fill(process.env.DEV_OTP);
  await page.getByRole("button",{name:"Verify & Continue"}).click();
  await page.waitForURL("**/app**");

  const acceptOne = async () => {
    await page.goto(`${BASE}/app/travel/trips/${trip.id}`);
    const btn = page.getByRole("button",{name:"Accept"});
    if (await btn.count() === 0) return "no-button";
    await btn.first().click();
    await page.waitForTimeout(2500);
    const err = page.getByText(/more than the trip|no longer/i);
    return await err.count() > 0 ? (await err.first().innerText()) : "accepted";
  };

  console.log(`Trip capacity: ${cap} kg\n`);
  console.log("Two 4 kg packages onto a 10 kg trip");
  await mk(4, true); await acceptOne();
  check("1st accepted", await matchCount() === 1, `${await matchCount()} match(es)`);
  check("  …4 kg committed", await carried() === 4, `${await carried()} kg`);
  check("  …trip still ACTIVE with room left", await tripStatus() === "active", await tripStatus());

  await mk(4, true); await acceptOne();
  check("2nd accepted onto the same trip", await matchCount() === 2, `${await matchCount()} match(es)`);
  check("  …8 kg committed", await carried() === 8, `${await carried()} kg`);
  check("  …trip still ACTIVE (2 kg spare)", await tripStatus() === "active", await tripStatus());

  console.log("\nA third 4 kg package does not fit the remaining 2 kg");
  const third = await mk(4, true);
  check("request is refused up front", third.status === 400, `status ${third.status}`);
  check("  …citing the SPARE capacity, not the total",
    /2 kg spare capacity/.test(third.body.error ?? ""), JSON.stringify(third.body.error));
  check("  …still only 2 matches", await matchCount() === 2);

  console.log("\nDiscovery reflects what's left");
  const [pkgSmall] = await sql`select * from packages where sender_id=${S} and weight_kg=4 limit 1`;
  const fits2 = await mk(2, false);
  check("a 2 kg package can still be created for this route", fits2.status === 200);

  console.log("\nFilling the trip closes it");
  const [p2] = await sql`select id from packages where sender_id=${S} and weight_kg=2 limit 1`;
  await sql`update packages set weight_kg = 2 where id = ${p2.id}`;
  await fetch(`${BASE}/api/packages`, { method:"POST",
    headers:{"content-type":"application/json",authorization:`Bearer ${tok}`},
    body: JSON.stringify({ fromLabel:"Madurai",fromLat:trip.from_lat,fromLng:trip.from_lng,
      toLabel:"Coimbatore",toLat:trip.to_lat,toLng:trip.to_lng, weightKg:2, description:"filler", tripId: trip.id }) });
  await acceptOne();
  check("trip is exactly full at 10 kg", await carried() === cap, `${await carried()} kg`);
  check("  …and is now MATCHED (closed to new packages)", await tripStatus() === "matched", await tripStatus());

  console.log("\nCancelling a match returns its space");
  const [one] = await sql`select id from matches where trip_id=${trip.id} and status<>'cancelled' limit 1`;
  await sql`update matches set status='cancelled' where id=${one.id}`;
  await sql`update trips set status='active' where id=${trip.id}`;
  check("carried weight drops back", await carried() < cap, `${await carried()} kg`);

  await sql`delete from transactions where match_id in (select id from matches where trip_id=${trip.id})`;
  await sql`delete from profiles where id = ${S}`;
  await sql`update trips set status='active', travel_date=${tripDate} where id=${trip.id}`;
  console.log(`\n${fails.length ? "❌" : "✅"} ${pass} passed, ${fails.length} failed`);
  if (fails.length) process.exitCode = 1;
} catch (e) { console.error("\n💥", e.message); process.exitCode = 1; }
finally { await browser?.close(); await sql.end(); }
