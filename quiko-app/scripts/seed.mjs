// DEV seed: a few traveler profiles + trips on the Chennai→Mumbai route so the
// sender's "find travelers" list isn't empty before the P2 traveler UI exists,
// plus the staff (admin/support) accounts documented in the root README so
// logging in as those phones actually opens /admin or /support instead of the
// customer app. Idempotent (fixed UUIDs). Run: npm run db:seed
import postgres from "postgres";

process.loadEnvFile(".env.local");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// fromLat/Lng ≈ Chennai pickup area, toLat/Lng ≈ Mumbai drop area.
// Trip dates relative to now so same-day / next-day / flexible all match.
const iso = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

const TRAVELERS = [
  { id: "11111111-1111-1111-1111-111111111111", phone: "919000000001", name: "Raj Kumar", rating: 4.8, deliveries: 35, trust: 198, kyc: 3, transport: "flight", cap: 10, pickup: "T. Nagar", drop: "Andheri", fromLat: 13.0418, fromLng: 80.2341, toLat: 19.1197, toLng: 72.8468, day: 0, dep: "08:00", arr: "10:15" },
  { id: "22222222-2222-2222-2222-222222222222", phone: "919000000002", name: "Meera Iyer", rating: 4.6, deliveries: 18, trust: 103, kyc: 2, transport: "train", cap: 15, pickup: "Egmore", drop: "Dadar", fromLat: 13.0732, fromLng: 80.2609, toLat: 19.0176, toLng: 72.8562, day: 1, dep: "06:30", arr: "21:45" },
  { id: "33333333-3333-3333-3333-333333333333", phone: "919000000003", name: "Arjun Nair", rating: 4.9, deliveries: 52, trust: 295, kyc: 4, transport: "flight", cap: 8, pickup: "Guindy", drop: "Bandra", fromLat: 13.0067, fromLng: 80.2206, toLat: 19.0596, toLng: 72.8295, day: 3, dep: "14:20", arr: "16:30" },
];

// Staff accounts (README "Seeded accounts" table). `919000000002` doubles as
// both a seeded traveler (above) and an admin — useful for testing admin
// screens against an account that also has real trips/matches.
const STAFF = [
  { id: "99999999-9999-9999-9999-999999999901", phone: "919999900001", name: "Admin", role: "admin" },
  { id: "22222222-2222-2222-2222-222222222222", phone: "919000000002", name: "Meera Iyer", role: "admin" },
  { id: "99999999-9999-9999-9999-999999999903", phone: "91939313463", name: "Support", role: "support" },
];

try {
  for (const t of TRAVELERS) {
    await sql`
      insert into profiles (id, phone, full_name, rating_avg, deliveries_count, trust_score, kyc_level)
      values (${t.id}, ${t.phone}, ${t.name}, ${t.rating}, ${t.deliveries}, ${t.trust}, ${t.kyc})
      on conflict (id) do update set
        rating_avg = excluded.rating_avg,
        deliveries_count = excluded.deliveries_count,
        trust_score = excluded.trust_score,
        kyc_level = excluded.kyc_level
    `;
    await sql`delete from trips where traveler_id = ${t.id}`;
    await sql`
      insert into trips (traveler_id, from_city, to_city, from_lat, from_lng, to_lat, to_lng, travel_date, depart_time, arrive_time, transport, capacity_kg, pickup_area, delivery_area, delivery_radius_km, status)
      values (${t.id}, 'Chennai', 'Mumbai', ${t.fromLat}, ${t.fromLng}, ${t.toLat}, ${t.toLng}, ${iso(t.day)}, ${t.dep}, ${t.arr}, ${t.transport}, ${t.cap}, ${t.pickup}, ${t.drop}, 10, 'active')
    `;
  }
  console.log(`✓ Seeded ${TRAVELERS.length} travelers + trips with schedules (Chennai→Mumbai, today/tomorrow/+3).`);

  for (const s of STAFF) {
    await sql`
      insert into profiles (id, phone, full_name, staff_role, is_admin)
      values (${s.id}, ${s.phone}, ${s.name}, ${s.role}, ${s.role === "admin"})
      on conflict (phone) do update set
        staff_role = excluded.staff_role,
        is_admin = excluded.is_admin,
        full_name = coalesce(profiles.full_name, excluded.full_name)
    `;
  }
  console.log(`✓ Seeded ${STAFF.length} staff accounts (${STAFF.filter((s) => s.role === "admin").length} admin, ${STAFF.filter((s) => s.role === "support").length} support).`);
} finally {
  await sql.end();
}
