// Integration test: an unverified traveller can be neither requested nor offered.
// Drives the real JSON API; flips kyc_level in the DB between cases.
import postgres from "postgres";
import { SignJWT } from "jose";

process.loadEnvFile(".env.local");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const BASE = "http://localhost:3000";
const SENDER_ID = "aaaaaaaa-0000-4000-8000-0000000000v1".replace("v1", "01");
const TRAVELER_ID = "11111111-1111-1111-1111-111111111111";

let pass = 0; const fails = [];
const check = (n, c, d = "") => c ? (pass++, console.log(`  ✓ ${n}`)) : (fails.push(n), console.log(`  ✗ ${n}${d ? ` — ${d}` : ""}`));
const token = (id) => new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(id).setIssuedAt().setExpirationTime("30d").sign(key);
const setKyc = (id, lvl) => sql`update profiles set kyc_level = ${lvl} where id = ${id}`;

try {
  const original = (await sql`select kyc_level from profiles where id = ${TRAVELER_ID}`)[0].kyc_level;
  await sql`delete from profiles where id = ${SENDER_ID}`;
  await sql`insert into profiles (id, phone, full_name, kyc_level) values (${SENDER_ID}, '919888800088', 'Gate Test Sender', 3)`;
  const [trip] = await sql`select id, from_lat, from_lng, to_lat, to_lng from trips where traveler_id = ${TRAVELER_ID} and status='active' limit 1`;
  const senderTok = await token(SENDER_ID);

  const request = () => fetch(`${BASE}/api/packages`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${senderTok}` },
    body: JSON.stringify({
      fromLabel: "Madurai", fromLat: trip.from_lat, fromLng: trip.from_lng,
      toLabel: "Coimbatore", toLat: trip.to_lat, toLng: trip.to_lng,
      weightKg: 2, description: "verify gate test", tripId: trip.id,
    }),
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));

  const pkgCount = async () => (await sql`select count(*)::int c from packages where sender_id = ${SENDER_ID}`)[0].c;

  console.log("\nSender -> traveller, traveller NOT verified (kyc_level 1)");
  await setKyc(TRAVELER_ID, 1);
  const blocked = await request();
  check("request rejected", blocked.status === 400, `status ${blocked.status}`);
  check("  …with the verification reason", /verified their identity/.test(blocked.body.error ?? ""), JSON.stringify(blocked.body.error));
  check("  …and NO orphan package was created", (await pkgCount()) === 0, `${await pkgCount()} package(s)`);

  console.log("\nSender -> traveller, traveller verified (kyc_level 3)");
  await setKyc(TRAVELER_ID, 3);
  const allowed = await request();
  check("request accepted", allowed.status === 200, `status ${allowed.status} ${JSON.stringify(allowed.body)}`);
  const reqs = await sql`select mr.id from match_requests mr join packages p on p.id = mr.package_id where p.sender_id = ${SENDER_ID}`;
  check("  …and the match_request exists", reqs.length === 1, `${reqs.length} request(s)`);

  console.log("\nBoundary");
  for (const lvl of [1, 2, 3, 4]) {
    await sql`delete from packages where sender_id = ${SENDER_ID}`;
    await setKyc(TRAVELER_ID, lvl);
    const r = await request();
    const want = lvl >= 3 ? 200 : 400;
    check(`kyc_level ${lvl} -> ${want === 200 ? "allowed" : "blocked"}`, r.status === want, `got ${r.status}`);
  }

  await setKyc(TRAVELER_ID, original);
  await sql`delete from profiles where id = ${SENDER_ID}`;
  await sql`update trips set status='active' where id = ${trip.id}`;
  console.log(`\n${fails.length ? "❌" : "✅"} ${pass} passed, ${fails.length} failed`);
  if (fails.length) process.exitCode = 1;
} catch (e) {
  console.error("\n💥", e.message); process.exitCode = 1;
} finally { await sql.end(); }
