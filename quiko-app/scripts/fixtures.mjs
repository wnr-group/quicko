// DEV FIXTURES — a full walkthrough dataset so a developer can see every major
// flow without clicking through the whole app first. Idempotent (fixed UUIDs):
// safe to run repeatedly. Run:  npm run db:fixtures
//
// Log in with the mock OTP 123456 and explore:
//   918888800001  Sam Sender      — active package + matches in every state
//   918888800002  Tara Traveller  — trips, one carrying + one delivered
//   919999900001  Admin           — full admin console
//   91939313463   Support         — assist-only ops console
//
// It creates: 2 demo users, Tara's trips, Sam's packages, and 4 matches —
// PAID (in progress), COMPLETED (+review), DISPUTED (open), CANCELLED (history) —
// with transactions, a timeline event log, a support thread, and a flagged report.
import postgres from "postgres";

process.loadEnvFile(".env.local");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const SAM = "fa000000-0000-0000-0000-000000000001";
const TARA = "fa000000-0000-0000-0000-000000000002";
const T = (n) => `fb000000-0000-0000-0000-0000000000${n}`; // trips
const P = (n) => `fc000000-0000-0000-0000-0000000000${n}`; // packages
const M = (n) => `fd000000-0000-0000-0000-0000000000${n}`; // matches

const day = (o) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const ago = (mins) => new Date(Date.now() - mins * 60000);
const FROM = { lat: 13.0604, lng: 80.2496 }; // Chennai
const TO = { lat: 19.076, lng: 72.8777 }; // Mumbai

try {
  await sql.begin(async (sql) => {
    // ── Staff roles (upsert by phone → keeps any existing account's id) ──
    await sql`insert into profiles (id, phone, full_name, is_admin, staff_role, kyc_level)
      values ('fa000000-0000-0000-0000-0000000000a1', '919999900001', 'Admin', true, 'admin', 3)
      on conflict (phone) do update set is_admin = true, staff_role = 'admin', full_name = coalesce(profiles.full_name, 'Admin')`;
    await sql`insert into profiles (id, phone, full_name, staff_role, kyc_level)
      values ('fa000000-0000-0000-0000-0000000000a2', '91939313463', 'Support Agent', 'support', 1)
      on conflict (phone) do update set staff_role = 'support', full_name = coalesce(profiles.full_name, 'Support Agent')`;

    // ── Demo sender + traveller ──
    await sql`insert into profiles (id, phone, full_name, rating_avg, deliveries_count, trust_score, kyc_level)
      values (${SAM}, '918888800001', 'Sam Sender', 4.7, 6, 84, 3)
      on conflict (id) do update set full_name = excluded.full_name, rating_avg = excluded.rating_avg`;
    await sql`insert into profiles (id, phone, full_name, rating_avg, deliveries_count, trust_score, kyc_level)
      values (${TARA}, '918888800002', 'Tara Traveller', 4.9, 41, 210, 3)
      on conflict (id) do update set full_name = excluded.full_name, rating_avg = excluded.rating_avg`;

    // ── Clean previous fixture rows (matches cascade to txns/events/disputes/ratings) ──
    await sql`delete from matches where id in (${M("01")}, ${M("02")}, ${M("03")}, ${M("04")})`;
    await sql`delete from packages where id in (${P("01")}, ${P("02")}, ${P("03")}, ${P("04")}, ${P("05")})`;
    await sql`delete from trips where id in (${T("01")}, ${T("02")}, ${T("03")}, ${T("04")}, ${T("05")})`;
    await sql`delete from support_threads where user_id = ${SAM}`;
    await sql`delete from reports where reported_user_id = ${TARA} and reporter_id is null`;

    // ── Tara's trips (Chennai → Mumbai) ──
    const trip = (id, o, status) => sql`insert into trips
      (id, traveler_id, from_city, to_city, from_lat, from_lng, to_lat, to_lng, travel_date, arrive_date, depart_time, arrive_time, transport, capacity_kg, pickup_area, delivery_area, delivery_radius_km, status, extra_detour_km)
      values (${id}, ${TARA}, 'Chennai', 'Mumbai', ${FROM.lat}, ${FROM.lng}, ${TO.lat}, ${TO.lng}, ${day(o)}, ${day(o)}, '08:00', '16:00', 'flight', 10, 'T. Nagar', 'Andheri', 10, ${status}, 5)`;
    await trip(T("01"), 0, "matched"); // → paid match
    await trip(T("02"), 1, "matched"); // → completed match
    await trip(T("03"), 2, "matched"); // → disputed match
    await trip(T("04"), 3, "active"); //  → cancelled match (trip reopened)
    await trip(T("05"), 2, "active"); //  spare, so "find travellers" isn't empty

    // ── Sam's packages ──
    const pkg = (id, status, desc) => sql`insert into packages
      (id, sender_id, from_city, to_city, from_lat, from_lng, to_lat, to_lng, travel_date, weight_kg, declared_value, time_preference, description, receiver_name, receiver_phone, offer_price, max_price, status)
      values (${id}, ${SAM}, 'Chennai', 'Mumbai', ${FROM.lat}, ${FROM.lng}, ${TO.lat}, ${TO.lng}, ${day(0)}, 1, 5000, 'flexible', ${desc}, 'Riya Receiver', '918888800009', 560, 560, ${status})`;
    await pkg(P("01"), "matched", "Documents and a small gift");
    await pkg(P("02"), "delivered", "A book");
    await pkg(P("03"), "in_transit", "Spare phone charger");
    await pkg(P("04"), "active", "Sweets box (was cancelled, reopened)");
    await pkg(P("05"), "active", "Laptop sleeve — waiting for a traveller");

    // ── Matches (one per state) ──
    const match = (id, pkgId, tripId, status, price, detourKm, detourFee) => sql`insert into matches
      (id, package_id, trip_id, sender_id, traveler_id, agreed_price, detour_km, detour_fee, detour_opted_out, detour_self_collect, status, delivery_otp)
      values (${id}, ${pkgId}, ${tripId}, ${SAM}, ${TARA}, ${price}, ${detourKm}, ${detourFee}, false, false, ${status}, '4321')`;
    await match(M("01"), P("01"), T("01"), "paid", 560, 0, 0);
    await match(M("02"), P("02"), T("02"), "completed", 620, 5, 60);
    await match(M("03"), P("03"), T("03"), "disputed", 560, 0, 0);
    await match(M("04"), P("04"), T("04"), "cancelled", 560, 0, 0);

    // ── Timeline events (drive the admin match-view timings) ──
    const ev = (mId, status, mins) => sql`insert into match_events (match_id, status, created_at) values (${mId}, ${status}, ${ago(mins)})`;
    await ev(M("01"), "paid", 120);
    await ev(M("02"), "paid", 300);
    await ev(M("02"), "picked_up", 220);
    await ev(M("02"), "in_transit", 160);
    await ev(M("02"), "delivered", 60);
    await ev(M("02"), "completed", 50);
    await ev(M("03"), "paid", 240);
    await ev(M("03"), "picked_up", 180);
    await ev(M("03"), "in_transit", 120);

    // ── Transactions ──
    const txn = (mId, type, status, amount, from, to) => sql`insert into transactions
      (match_id, type, status, amount, from_profile, to_profile, provider, provider_ref)
      values (${mId}, ${type}, ${status}, ${amount}, ${from}, ${to}, 'simulated', ${"q_" + mId})`;
    await txn(M("01"), "escrow_hold", "held", 560, SAM, null);
    await txn(M("02"), "escrow_hold", "released", 620, SAM, null);
    await txn(M("02"), "payout", "released", 608, null, TARA);
    await txn(M("02"), "commission", "released", 12, null, null);
    await txn(M("03"), "escrow_hold", "held", 560, SAM, null);
    await txn(M("04"), "escrow_hold", "refunded", 560, SAM, null);
    await txn(M("04"), "refund", "refunded", 560, null, SAM);

    // ── Review on the completed delivery ──
    await sql`insert into ratings (match_id, rater_id, ratee_id, rater_role, overall, comment)
      values (${M("02")}, ${SAM}, ${TARA}, 'sender', 5, 'Super smooth — picked up on time and delivered safely. Thanks Tara!')`;

    // ── Open dispute on the disputed match (raised by Sam) ──
    await sql`insert into disputes (match_id, raised_by, reason, detail, prior_status, status)
      values (${M("03")}, ${SAM}, 'no_show', 'Traveller said picked up but the receiver never got a call.', 'in_transit', 'open')`;

    // ── A support conversation (open) ──
    const [thread] = await sql`insert into support_threads (user_id, status) values (${SAM}, 'open') returning id`;
    await sql`insert into support_messages (thread_id, sender_id, from_staff, body)
      values (${thread.id}, ${SAM}, false, 'Hi, my package pickup seems delayed — can you check on it?')`;

    // ── A moderation flag (auto: tried to share a phone number in chat) ──
    await sql`insert into reports (reporter_id, reported_user_id, match_id, type, detail)
      values (null, ${TARA}, ${M("01")}, 'auto_contact', 'Tried to share a phone number in chat')`;
  });

  console.log("✓ Fixtures loaded. Log in (OTP 123456) as:");
  console.log("    918888800001  Sam Sender     — active package + 4 matches (paid / completed / disputed / cancelled)");
  console.log("    918888800002  Tara Traveller — trips, carrying + delivered");
  console.log("    919999900001  Admin          — dashboard, disputes, moderation, etc.");
  console.log("    91939313463   Support        — assist-only ops console");
} finally {
  await sql.end();
}
