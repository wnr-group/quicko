import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { trips, profiles, matches, packages } from "@/db/schema";
import { routeMatches } from "@/core/geo";

/**
 * Discovery-first: travelers on a route within a date window, WITHOUT a weight
 * filter (package details not given yet) and WITHOUT price. Sorted by arrival
 * (earliest first) so the soonest deliveries surface.
 */
export async function exploreTrips(params: {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  dateFrom: string;
  dateTo: string;
}) {
  const rows = await db
    .select({
      trip: trips,
      traveler: {
        id: profiles.id,
        fullName: profiles.fullName,
        avatar: profiles.avatar,
        ratingAvg: profiles.ratingAvg,
        deliveriesCount: profiles.deliveriesCount,
        trustScore: profiles.trustScore,
        kycLevel: profiles.kycLevel,
      },
    })
    .from(trips)
    .innerJoin(profiles, eq(trips.travelerId, profiles.id))
    .where(
      and(
        gte(trips.travelDate, params.dateFrom),
        lte(trips.travelDate, params.dateTo),
        eq(trips.status, "active"),
        // A suspended traveller can't accept, pick up or deliver — keep their
        // trips out of discovery so nobody requests (and pays for) a dead end.
        eq(profiles.status, "active"),
      ),
    )
    .orderBy(asc(trips.travelDate), asc(trips.arriveTime));

  const from = { lat: params.fromLat, lng: params.fromLng };
  const to = { lat: params.toLat, lng: params.toLng };
  return rows.filter(
    ({ trip }) =>
      trip.fromLat != null &&
      trip.fromLng != null &&
      trip.toLat != null &&
      trip.toLng != null &&
      routeMatches(from, to, { lat: trip.fromLat, lng: trip.fromLng }, { lat: trip.toLat, lng: trip.toLng }),
  );
}

export type MatchingTrip = Awaited<ReturnType<typeof findMatchingTrips>>[number];

/**
 * Travelers whose trip fits a package: within the date window, enough spare
 * capacity, active, and whose route endpoints match (pickup ≤15km, drop ≤20km).
 * Ranked by trust.
 */
export async function findMatchingTrips(pkg: {
  senderId: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  travelDate: string; // window start
  dateTo: string | null; // window end (null = single day)
  weightKg: number;
}) {
  // A trip carries several packages, so what matters is the capacity it has
  // LEFT, not the capacity it started with. `spareKg` is also what the traveller
  // card shows as "kg free" — advertising the total would promise space that is
  // already committed.
  const spareKg = sql<string>`${trips.capacityKg} - coalesce((
    select sum(${packages.weightKg}) from ${matches}
    join ${packages} on ${packages.id} = ${matches.packageId}
    where ${matches.tripId} = ${trips.id} and ${matches.status} <> 'cancelled'
  ), 0)`;

  const rows = await db
    .select({
      trip: trips,
      spareKg,
      traveler: {
        id: profiles.id,
        fullName: profiles.fullName,
        avatar: profiles.avatar,
        ratingAvg: profiles.ratingAvg,
        deliveriesCount: profiles.deliveriesCount,
        trustScore: profiles.trustScore,
        kycLevel: profiles.kycLevel,
      },
    })
    .from(trips)
    .innerJoin(profiles, eq(trips.travelerId, profiles.id))
    .where(
      and(
        gte(trips.travelDate, pkg.travelDate),
        lte(trips.travelDate, pkg.dateTo ?? pkg.travelDate),
        eq(trips.status, "active"),
        gte(spareKg, pkg.weightKg),
        eq(profiles.status, "active"), // no suspended travellers
        ne(trips.travelerId, pkg.senderId), // you can't carry your own package
      ),
    )
    .orderBy(desc(profiles.trustScore), desc(profiles.ratingAvg));

  const from = { lat: pkg.fromLat, lng: pkg.fromLng };
  const to = { lat: pkg.toLat, lng: pkg.toLng };

  return rows.filter(({ trip }) => {
    if (
      trip.fromLat == null ||
      trip.fromLng == null ||
      trip.toLat == null ||
      trip.toLng == null
    ) {
      return false;
    }
    return routeMatches(
      from,
      to,
      { lat: trip.fromLat, lng: trip.fromLng },
      { lat: trip.toLat, lng: trip.toLng },
    );
  });
}

export async function getTrip(id: string) {
  const [row] = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  return row ?? null;
}

export async function getTripWithTraveler(id: string) {
  const [row] = await db
    .select({ trip: trips, travelerName: profiles.fullName })
    .from(trips)
    .innerJoin(profiles, eq(trips.travelerId, profiles.id))
    .where(eq(trips.id, id))
    .limit(1);
  return row ?? null;
}

import type { CreateTripInput } from "@/lib/validation";

export async function createTrip(travelerId: string, input: CreateTripInput) {
  const [row] = await db
    .insert(trips)
    .values({
      travelerId,
      fromCity: input.fromLabel,
      toCity: input.toLabel,
      fromLat: input.fromLat,
      fromLng: input.fromLng,
      toLat: input.toLat,
      toLng: input.toLng,
      travelDate: input.travelDate,
      arriveDate: input.arriveDate,
      departTime: input.departTime,
      arriveTime: input.arriveTime,
      transport: input.transport,
      capacityKg: input.capacityKg,
      extraDetourKm: input.extraDetourKm,
      pickupArea: input.fromLabel,
      deliveryArea: input.toLabel,
    })
    .returning();
  return row;
}

export async function getMyTrips(travelerId: string) {
  const rows = await db
    .select()
    .from(trips)
    .where(eq(trips.travelerId, travelerId))
    .orderBy(desc(trips.travelDate));
  if (rows.length === 0) return [];

  // Same rule as exploreTrips: the card must show capacity LEFT, not the
  // capacity the trip started with, or it advertises committed space.
  const booked = await db
    .select({ tripId: matches.tripId, kg: sql<string>`sum(${packages.weightKg})` })
    .from(matches)
    .innerJoin(packages, eq(packages.id, matches.packageId))
    .where(
      and(
        inArray(
          matches.tripId,
          rows.map((t) => t.id),
        ),
        ne(matches.status, "cancelled"),
      ),
    )
    .groupBy(matches.tripId);

  const used = new Map(booked.map((b) => [b.tripId, Number(b.kg)]));
  return rows.map((t) => ({ ...t, spareKg: t.capacityKg - (used.get(t.id) ?? 0) }));
}

export async function getOwnedTrip(id: string, travelerId: string) {
  const [row] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.travelerId, travelerId)))
    .limit(1);
  return row ?? null;
}

/** Cancel (delete) an owned, still-active trip. */
export async function deleteTrip(id: string, travelerId: string) {
  const [row] = await db
    .delete(trips)
    .where(and(eq(trips.id, id), eq(trips.travelerId, travelerId), eq(trips.status, "active")))
    .returning();
  return row ?? null;
}
