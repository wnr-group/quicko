import "server-only";
import { inArray, desc, asc, sql, eq, or, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { profiles, packages, trips, matches, transactions, messages, matchEvents, kycVerifications, supportThreads, disputes, reports } from "@/db/schema";
import { detourKm } from "@/core/geo";
import { QUIKO_COMMISSION_RATE } from "@/core/pricing";

const DONE = ["delivered", "completed"] as const;
const N = sql<number>`count(*)`;

/** High-level platform metrics for the admin dashboard. */
export async function getPlatformStats() {
  const [[u], [p], [t], [m], [done]] = await Promise.all([
    db.select({ n: N }).from(profiles),
    db.select({ n: N }).from(packages),
    db.select({ n: N }).from(trips),
    db.select({ n: N }).from(matches),
    db
      .select({ n: N, gmv: sql<number>`coalesce(sum(${matches.agreedPrice}), 0)` })
      .from(matches)
      .where(inArray(matches.status, [...DONE])),
  ]);

  const gmv = Number(done?.gmv ?? 0);
  return {
    users: Number(u?.n ?? 0),
    packages: Number(p?.n ?? 0),
    trips: Number(t?.n ?? 0),
    matches: Number(m?.n ?? 0),
    delivered: Number(done?.n ?? 0),
    gmv,
    commission: Math.round(gmv * QUIKO_COMMISSION_RATE),
  };
}

/** Operational KPIs + route supply/demand for the dashboard. */
export async function getOpsMetrics() {
  // Run all five independent aggregates in one parallel batch rather than five
  // sequential round-trips — far fewer sequential hops for the heaviest page.
  const [[pkgCounts], [mc], [ttm], demand, supply] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        matched: sql<number>`count(*) filter (where ${packages.status} <> 'active')::int`,
      })
      .from(packages),
    db
      .select({
        total: sql<number>`count(*)::int`,
        delivered: sql<number>`count(*) filter (where ${matches.status} in ('delivered','completed'))::int`,
        cancelled: sql<number>`count(*) filter (where ${matches.status} = 'cancelled')::int`,
        disputed: sql<number>`count(*) filter (where ${matches.status} = 'disputed')::int`,
      })
      .from(matches),
    db
      .select({
        avgHours: sql<number>`coalesce(avg(extract(epoch from (${matches.createdAt} - ${packages.createdAt})) / 3600), 0)`,
      })
      .from(matches)
      .innerJoin(packages, eq(matches.packageId, packages.id)),
    db
      .select({ route: sql<string>`${packages.fromCity} || ' → ' || ${packages.toCity}`, n: sql<number>`count(*)::int` })
      .from(packages)
      .where(eq(packages.status, "active"))
      .groupBy(packages.fromCity, packages.toCity)
      .orderBy(sql`count(*) desc`)
      .limit(6),
    db
      .select({ route: sql<string>`${trips.fromCity} || ' → ' || ${trips.toCity}`, n: sql<number>`count(*)::int` })
      .from(trips)
      .where(eq(trips.status, "active"))
      .groupBy(trips.fromCity, trips.toCity)
      .orderBy(sql`count(*) desc`)
      .limit(6),
  ]);

  const pct = (num: number, den: number) => (den ? Math.round((num / den) * 100) : 0);
  return {
    matchRate: pct(pkgCounts.matched, pkgCounts.total),
    successRate: pct(mc.delivered, mc.total),
    cancelRate: pct(mc.cancelled, mc.total),
    disputed: mc.disputed,
    avgTimeToMatchHours: Math.round(Number(ttm.avgHours) * 10) / 10,
    demand,
    supply,
  };
}

/**
 * Everything the admin dashboard shows, in ONE round trip.
 *
 * It used to be 15 separate queries fired with Promise.all. Against Supabase's
 * transaction pooler from a Vercel Lambda that is genuinely harmful: a single
 * page render grabbed up to `max` pooler connections at once, and backends
 * were observed wedging in `Client/ClientRead` (three at a time, 120s+) until
 * the page blew its deadline. Every value below is an independent scalar
 * aggregate or a small list, so one statement answers the whole page — one
 * connection, one round trip, nothing to fan out and nothing to wedge.
 */
export async function getDashboardSnapshot() {
  const [row] = await db.execute<{
    users: number; packages: number; trips: number; matches: number;
    delivered: number; gmv: string | number;
    pending_kyc: number; open_support: number; open_disputes: number;
    open_reports: number; unmatched: number;
    pkg_total: number; pkg_matched: number;
    match_total: number; match_delivered: number; match_cancelled: number; match_disputed: number;
    avg_hours: string | number;
    demand: { route: string; n: number }[] | null;
    supply: { route: string; n: number }[] | null;
  }>(sql`
    select
      (select count(*)::int from ${profiles})                                             as users,
      (select count(*)::int from ${packages})                                             as packages,
      (select count(*)::int from ${trips})                                                as trips,
      (select count(*)::int from ${matches})                                              as matches,
      (select count(*)::int from ${matches}
         where ${matches.status} in ('delivered','completed'))                            as delivered,
      (select coalesce(sum(${matches.agreedPrice}), 0) from ${matches}
         where ${matches.status} in ('delivered','completed'))                            as gmv,
      (select count(*)::int from ${kycVerifications} where ${kycVerifications.status} = 'pending') as pending_kyc,
      (select count(*)::int from ${supportThreads}  where ${supportThreads.status}  = 'open')      as open_support,
      (select count(*)::int from ${disputes}        where ${disputes.status}        = 'open')      as open_disputes,
      (select count(*)::int from ${reports}         where ${reports.status}         = 'open')      as open_reports,
      (select count(*)::int from ${packages}        where ${packages.status}        = 'active')    as unmatched,
      (select count(*)::int from ${packages})                                             as pkg_total,
      (select count(*)::int from ${packages} where ${packages.status} <> 'active')        as pkg_matched,
      (select count(*)::int from ${matches})                                              as match_total,
      (select count(*)::int from ${matches} where ${matches.status} in ('delivered','completed')) as match_delivered,
      (select count(*)::int from ${matches} where ${matches.status} = 'cancelled')        as match_cancelled,
      (select count(*)::int from ${matches} where ${matches.status} = 'disputed')         as match_disputed,
      (select coalesce(avg(extract(epoch from (${matches.createdAt} - ${packages.createdAt})) / 3600), 0)
         from ${matches} join ${packages} on ${matches.packageId} = ${packages.id})       as avg_hours,
      (select coalesce(json_agg(d), '[]'::json) from (
         select ${packages.fromCity} || ' → ' || ${packages.toCity} as route, count(*)::int as n
         from ${packages} where ${packages.status} = 'active'
         group by ${packages.fromCity}, ${packages.toCity} order by count(*) desc limit 6) d)      as demand,
      (select coalesce(json_agg(s), '[]'::json) from (
         select ${trips.fromCity} || ' → ' || ${trips.toCity} as route, count(*)::int as n
         from ${trips} where ${trips.status} = 'active'
         group by ${trips.fromCity}, ${trips.toCity} order by count(*) desc limit 6) s)           as supply
  `);

  const n = (v: unknown) => Number(v ?? 0);
  const pct = (num: number, den: number) => (den ? Math.round((num / den) * 100) : 0);
  const gmv = n(row?.gmv);

  return {
    stats: {
      users: n(row?.users),
      packages: n(row?.packages),
      trips: n(row?.trips),
      matches: n(row?.matches),
      delivered: n(row?.delivered),
      gmv,
      commission: Math.round(gmv * QUIKO_COMMISSION_RATE),
    },
    pendingKyc: n(row?.pending_kyc),
    openSupport: n(row?.open_support),
    openDisputes: n(row?.open_disputes),
    openReports: n(row?.open_reports),
    unmatched: n(row?.unmatched),
    metrics: {
      matchRate: pct(n(row?.pkg_matched), n(row?.pkg_total)),
      successRate: pct(n(row?.match_delivered), n(row?.match_total)),
      cancelRate: pct(n(row?.match_cancelled), n(row?.match_total)),
      disputed: n(row?.match_disputed),
      avgTimeToMatchHours: Math.round(n(row?.avg_hours) * 10) / 10,
      demand: row?.demand ?? [],
      supply: row?.supply ?? [],
    },
  };
}

/** All users, newest first (admin list). */
export async function listUsers(limit = 200) {
  return db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      phone: profiles.phone,
      kycLevel: profiles.kycLevel,
      deliveriesCount: profiles.deliveriesCount,
      ratingAvg: profiles.ratingAvg,
      isAdmin: profiles.isAdmin,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .orderBy(desc(profiles.createdAt))
    .limit(limit);
}

const looksLikeUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** Cross-entity admin search: users (name/phone), packages/trips (city), or an exact id. */
export async function adminSearch(q: string) {
  const term = q.trim();
  if (!term) return { users: [], packages: [], trips: [], matchId: null as string | null };
  const like = `%${term}%`;
  const digits = term.replace(/\D/g, "");

  const [users, pkgs, trps] = await Promise.all([
    db
      .select({ id: profiles.id, fullName: profiles.fullName, phone: profiles.phone, staffRole: profiles.staffRole })
      .from(profiles)
      .where(or(ilike(profiles.fullName, like), digits ? ilike(profiles.phone, `%${digits}%`) : ilike(profiles.phone, like)))
      .limit(10),
    db
      .select({ id: packages.id, fromCity: packages.fromCity, toCity: packages.toCity, status: packages.status })
      .from(packages)
      .where(or(ilike(packages.fromCity, like), ilike(packages.toCity, like)))
      .limit(10),
    db
      .select({ id: trips.id, fromCity: trips.fromCity, toCity: trips.toCity, status: trips.status })
      .from(trips)
      .where(or(ilike(trips.fromCity, like), ilike(trips.toCity, like)))
      .limit(10),
  ]);

  // If they pasted a UUID, offer a direct match link too.
  const matchId = looksLikeUuid(term) ? term : null;
  return { users, packages: pkgs, trips: trps, matchId };
}

/** One user with everything: profile, their packages, trips, and matches. */
export async function getAdminUser(id: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!profile) return null;
  const [pkgs, trps, asSender, asTraveler] = await Promise.all([
    db.select().from(packages).where(eq(packages.senderId, id)).orderBy(desc(packages.createdAt)).limit(50),
    db.select().from(trips).where(eq(trips.travelerId, id)).orderBy(desc(trips.createdAt)).limit(50),
    db.select().from(matches).where(eq(matches.senderId, id)).orderBy(desc(matches.createdAt)).limit(50),
    db.select().from(matches).where(eq(matches.travelerId, id)).orderBy(desc(matches.createdAt)).limit(50),
  ]);
  // A user can be both sides of the same match, so the two queries can return
  // the same row twice — de-dupe before returning or the UI renders it twice.
  const byId = new Map<string, (typeof asSender)[number]>();
  for (const m of [...asSender, ...asTraveler]) byId.set(m.id, m);
  const allMatches = [...byId.values()].sort(
    (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
  );

  return { profile, packages: pkgs, trips: trps, matches: allMatches };
}

/** One match with full state: package, both parties, transactions, chat. */
export async function getAdminMatch(id: string) {
  const sender = alias(profiles, "sender");
  const traveler = alias(profiles, "traveler");
  const [row] = await db
    .select({
      match: matches,
      pkg: packages,
      sender: { id: sender.id, fullName: sender.fullName, phone: sender.phone, staffRole: sender.staffRole },
      traveler: { id: traveler.id, fullName: traveler.fullName, phone: traveler.phone, staffRole: traveler.staffRole },
    })
    .from(matches)
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .innerJoin(sender, eq(matches.senderId, sender.id))
    .innerJoin(traveler, eq(matches.travelerId, traveler.id))
    .where(eq(matches.id, id))
    .limit(1);
  if (!row) return null;

  const [txns, msgs, events] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.matchId, id)).orderBy(asc(transactions.createdAt)),
    db
      .select({ id: messages.id, senderId: messages.senderId, body: messages.body, createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.matchId, id))
      .orderBy(asc(messages.createdAt)),
    db.select({ status: matchEvents.status, createdAt: matchEvents.createdAt }).from(matchEvents).where(eq(matchEvents.matchId, id)).orderBy(asc(matchEvents.createdAt)),
  ]);
  // status → earliest timestamp it was reached ("confirmed" = match creation).
  const eventTimes: Record<string, Date> = { confirmed: row.match.createdAt };
  for (const e of events) if (!eventTimes[e.status]) eventTimes[e.status] = e.createdAt;
  return { ...row, transactions: txns, messages: msgs, eventTimes };
}

export async function getAdminPackage(id: string) {
  const [pkg] = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!pkg) return null;
  const [sender] = await db
    .select({ id: profiles.id, fullName: profiles.fullName, phone: profiles.phone })
    .from(profiles)
    .where(eq(profiles.id, pkg.senderId))
    .limit(1);
  const rel = await db.select().from(matches).where(eq(matches.packageId, id)).orderBy(desc(matches.createdAt));
  return { pkg, sender, matches: rel };
}

/** Packages still waiting for a match (concierge queue). */
export async function listUnmatchedPackages() {
  return db
    .select({
      pkg: { id: packages.id, fromCity: packages.fromCity, toCity: packages.toCity, weightKg: packages.weightKg, createdAt: packages.createdAt },
      sender: { id: profiles.id, fullName: profiles.fullName },
    })
    .from(packages)
    .innerJoin(profiles, eq(packages.senderId, profiles.id))
    .where(eq(packages.status, "active"))
    .orderBy(desc(packages.createdAt))
    .limit(200);
}

export async function countUnmatchedPackages(): Promise<number> {
  // Count in SQL: pulling every active package id back just to read .length
  // grows the payload with the table for a number the page renders as a badge.
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(packages)
    .where(eq(packages.status, "active"));
  return row?.n ?? 0;
}

/** One unmatched package + active trips ranked by how little detour they'd add. */
export async function candidateTripsForPackage(packageId: string) {
  const [pkg] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
  if (!pkg) return null;
  const [sender] = await db
    .select({ id: profiles.id, fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.id, pkg.senderId))
    .limit(1);

  const active = await db
    .select({
      trip: trips,
      traveler: { id: profiles.id, fullName: profiles.fullName, kycLevel: profiles.kycLevel },
    })
    .from(trips)
    .innerJoin(profiles, eq(trips.travelerId, profiles.id))
    .where(eq(trips.status, "active"))
    .limit(150);

  const candidates = active
    .filter((t) => t.trip.travelerId !== pkg.senderId)
    .map((t) => {
      const hasCoords =
        t.trip.fromLat != null && t.trip.fromLng != null && t.trip.toLat != null && t.trip.toLng != null;
      const km = hasCoords
        ? detourKm(
            { lat: t.trip.fromLat!, lng: t.trip.fromLng! },
            { lat: pkg.fromLat, lng: pkg.fromLng },
            { lat: pkg.toLat, lng: pkg.toLng },
            { lat: t.trip.toLat!, lng: t.trip.toLng! },
          )
        : Number.POSITIVE_INFINITY;
      return { ...t, detourKm: Number.isFinite(km) ? Math.round(km) : null };
    })
    .sort((a, b) => (a.detourKm ?? 1e9) - (b.detourKm ?? 1e9))
    .slice(0, 20);

  return { pkg, sender, candidates };
}

/** Recent transactions across all matches (ops money view). */
export async function listRecentTransactions(limit = 100) {
  return db
    .select({
      id: transactions.id,
      matchId: transactions.matchId,
      type: transactions.type,
      status: transactions.status,
      amount: transactions.amount,
      provider: transactions.provider,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getAdminTrip(id: string) {
  const [trip] = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  if (!trip) return null;
  const [traveler] = await db
    .select({ id: profiles.id, fullName: profiles.fullName, phone: profiles.phone })
    .from(profiles)
    .where(eq(profiles.id, trip.travelerId))
    .limit(1);
  const rel = await db.select().from(matches).where(eq(matches.tripId, id)).orderBy(desc(matches.createdAt));
  return { trip, traveler, matches: rel };
}
