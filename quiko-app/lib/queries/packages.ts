import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, ne, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { packages, profiles, matchRequests } from "@/db/schema";
import { calculatePrice } from "@/core/pricing";
import { roadDistanceKm, routeMatches } from "@/core/geo";
import type { CreatePackageInput } from "@/lib/validation";

// The server recomputes distance from the pinned coordinates and the max price
// (never trust the client), then clamps the offer.
export async function createPackage(senderId: string, input: CreatePackageInput) {
  const distance = roadDistanceKm(
    { lat: input.fromLat, lng: input.fromLng },
    { lat: input.toLat, lng: input.toLng },
  );
  const { maxPrice } = calculatePrice({
    weightKg: input.weightKg,
    distanceKm: distance,
    timePreference: input.timePreference,
  });
  const offerPrice = Math.min(input.offerPrice, maxPrice);

  const [row] = await db
    .insert(packages)
    .values({
      senderId,
      fromCity: input.fromLabel,
      toCity: input.toLabel,
      fromLat: input.fromLat,
      fromLng: input.fromLng,
      toLat: input.toLat,
      toLng: input.toLng,
      travelDate: input.travelDate,
      dateTo: input.dateTo ?? null,
      weightKg: input.weightKg,
      declaredValue: input.declaredValue ?? 0,
      timePreference: input.timePreference,
      description: input.description,
      receiverName: input.receiverName,
      receiverPhone: input.receiverPhone,
      offerPrice,
      maxPrice,
    })
    .returning();
  return row;
}

/**
 * Traveler discovery: active packages a given trip could carry. The trip's
 * travel date must fall inside the package's [travelDate, dateTo] window, the
 * package must fit spare capacity, and the endpoints must match (pickup ≤15km,
 * drop ≤20km). Excludes packages this trip has already offered on. Newest first.
 */
export async function explorePackages(params: {
  tripId: string;
  travelerId: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  tripDate: string;
  capacityKg: number;
}) {
  // Packages this trip already has a live request for → hide them.
  const requested = await db
    .select({ packageId: matchRequests.packageId })
    .from(matchRequests)
    .where(
      and(
        eq(matchRequests.tripId, params.tripId),
        inArray(matchRequests.status, ["pending", "accepted"]),
      ),
    );
  const excludeIds = requested.map((r) => r.packageId);

  const rows = await db
    .select({
      package: packages,
      sender: {
        id: profiles.id,
        fullName: profiles.fullName,
        avatar: profiles.avatar,
        ratingAvg: profiles.ratingAvg,
        deliveriesCount: profiles.deliveriesCount,
      },
    })
    .from(packages)
    .innerJoin(profiles, eq(packages.senderId, profiles.id))
    .where(
      and(
        eq(packages.status, "active"),
        gte(packages.weightKg, 0),
        lte(packages.weightKg, params.capacityKg),
        eq(profiles.status, "active"), // no suspended senders
        ne(packages.senderId, params.travelerId), // you can't carry your own package
        lte(packages.travelDate, params.tripDate),
        gte(sql`coalesce(${packages.dateTo}, ${packages.travelDate})`, params.tripDate),
        excludeIds.length > 0 ? notInArray(packages.id, excludeIds) : undefined,
      ),
    )
    .orderBy(asc(packages.travelDate), desc(packages.createdAt));

  const from = { lat: params.fromLat, lng: params.fromLng };
  const to = { lat: params.toLat, lng: params.toLng };
  return rows.filter(
    ({ package: pkg }) =>
      pkg.fromLat != null &&
      pkg.fromLng != null &&
      pkg.toLat != null &&
      pkg.toLng != null &&
      routeMatches(from, to, { lat: pkg.fromLat, lng: pkg.fromLng }, { lat: pkg.toLat, lng: pkg.toLng }),
  );
}

export async function getMyPackages(senderId: string) {
  return db
    .select()
    .from(packages)
    .where(eq(packages.senderId, senderId))
    .orderBy(desc(packages.createdAt));
}

export async function getPackage(id: string) {
  const [row] = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  return row ?? null;
}

/** A package the caller owns, or null (used to authorize detail pages). */
export async function getOwnedPackage(id: string, senderId: string) {
  const [row] = await db
    .select()
    .from(packages)
    .where(and(eq(packages.id, id), eq(packages.senderId, senderId)))
    .limit(1);
  return row ?? null;
}

/**
 * Update an owned, still-active package. Recomputes distance + max price and
 * re-clamps the offer. Returns null if not owned or no longer active (matched).
 */
export async function updatePackage(
  id: string,
  senderId: string,
  input: CreatePackageInput,
) {
  const distance = roadDistanceKm(
    { lat: input.fromLat, lng: input.fromLng },
    { lat: input.toLat, lng: input.toLng },
  );
  const { maxPrice } = calculatePrice({
    weightKg: input.weightKg,
    distanceKm: distance,
    timePreference: input.timePreference,
  });
  const offerPrice = Math.min(input.offerPrice, maxPrice);

  const [row] = await db
    .update(packages)
    .set({
      fromCity: input.fromLabel,
      toCity: input.toLabel,
      fromLat: input.fromLat,
      fromLng: input.fromLng,
      toLat: input.toLat,
      toLng: input.toLng,
      travelDate: input.travelDate,
      dateTo: input.dateTo ?? null,
      weightKg: input.weightKg,
      declaredValue: input.declaredValue ?? 0,
      timePreference: input.timePreference,
      description: input.description,
      receiverName: input.receiverName,
      receiverPhone: input.receiverPhone,
      offerPrice,
      maxPrice,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(packages.id, id),
        eq(packages.senderId, senderId),
        eq(packages.status, "active"),
      ),
    )
    .returning();
  return row ?? null;
}

/** Set receiver details on an owned package (allowed at any status). */
export async function setPackageReceiver(
  id: string,
  senderId: string,
  name: string,
  phone: string,
) {
  const [row] = await db
    .update(packages)
    .set({ receiverName: name, receiverPhone: phone, updatedAt: new Date() })
    .where(and(eq(packages.id, id), eq(packages.senderId, senderId)))
    .returning();
  return row ?? null;
}

/** Delete an owned, still-active package (cascades its pending requests). */
export async function deletePackage(id: string, senderId: string) {
  const [row] = await db
    .delete(packages)
    .where(
      and(
        eq(packages.id, id),
        eq(packages.senderId, senderId),
        eq(packages.status, "active"),
      ),
    )
    .returning();
  return row ?? null;
}
