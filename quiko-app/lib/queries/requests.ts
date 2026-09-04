import "server-only";
import { randomInt } from "node:crypto";
import { and, desc, eq, inArray, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { matchRequests, matches, packages, trips, profiles } from "@/db/schema";
import { notify } from "@/lib/queries/notifications";
import { logAdminAction } from "@/lib/queries/audit";
import { detourKm, detourTier } from "@/core/geo";
import { detourFee } from "@/core/pricing";
import type { Role } from "@/core/types";

function genOtp(): string {
  return String(randomInt(1000, 10000)); // 4-digit
}

/**
 * A trip may only carry a package that fits its spare capacity.
 *
 * This is the binding rule, enforced at every write that pairs a package with a
 * trip. The capacity conditions in the discovery queries (`findMatchingTrips`,
 * `explorePackages`) only shape what gets *listed* — the explore-first sender
 * flow deliberately lists trips before the weight is known, so nothing upstream
 * guarantees the pair actually fits.
 *
 * Returns an error message, or null when the package fits.
 */
export function capacityError(weightKg: number, capacityKg: number): string | null {
  if (weightKg <= capacityKg) return null;
  return `This package is ${weightKg} kg — more than the trip's ${capacityKg} kg spare capacity.`;
}

/**
 * Spare capacity of a trip with a still-pending request on this package that
 * could no longer carry `weightKg` (i.e. the sender is editing the weight up
 * from under a traveller who already has a request in their queue).
 */
export async function pendingRequestOverCapacity(
  packageId: string,
  weightKg: number,
): Promise<number | null> {
  const [row] = await db
    .select({ capacityKg: trips.capacityKg })
    .from(matchRequests)
    .innerJoin(trips, eq(matchRequests.tripId, trips.id))
    .where(
      and(
        eq(matchRequests.packageId, packageId),
        eq(matchRequests.status, "pending"),
        lt(trips.capacityKg, weightKg),
      ),
    )
    .limit(1);
  return row?.capacityKg ?? null;
}

type PkgCoords = { fromLat: number; fromLng: number; toLat: number; toLng: number };
type TripCoords = {
  fromLat: number | null; fromLng: number | null;
  toLat: number | null; toLng: number | null; extraDetourKm: number;
};

/**
 * Detour this package adds to the trip, priced. Toggle defaults to ON
 * (door-service), so `fee` is baked into the match's agreedPrice at creation
 * unless the detour exceeds the traveller's willingness (→ self-collect, ₹0).
 */
function matchDetour(pkg: PkgCoords, trip: TripCoords) {
  if (trip.fromLat == null || trip.fromLng == null || trip.toLat == null || trip.toLng == null) {
    return { km: 0, fee: 0, selfCollect: false };
  }
  const km = detourKm(
    { lat: trip.fromLat, lng: trip.fromLng },
    { lat: pkg.fromLat, lng: pkg.fromLng },
    { lat: pkg.toLat, lng: pkg.toLng },
    { lat: trip.toLat, lng: trip.toLng },
  );
  const tier = detourTier(km, trip.extraDetourKm);
  return {
    km: Math.round(km),
    fee: tier === "payable" ? detourFee(km) : 0,
    selfCollect: tier === "self_collect",
  };
}

export async function sendRequest(params: {
  packageId: string;
  tripId: string;
  requestedBy: string;
  initiatorRole: Role;
  amount: number;
}) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(matchRequests)
      .values({ ...params, status: "pending" })
      .returning();

    const [pkg] = await tx.select().from(packages).where(eq(packages.id, params.packageId)).limit(1);
    const route = pkg ? `${pkg.fromCity} → ${pkg.toCity}` : "a package";

    if (params.initiatorRole === "sender" && params.tripId) {
      // Sender asked a traveler → notify that traveler.
      const [trip] = await tx.select().from(trips).where(eq(trips.id, params.tripId)).limit(1);
      if (trip) {
        await notify(tx, {
          profileId: trip.travelerId,
          type: "request_received",
          title: "New delivery request",
          body: `Someone wants you to carry ${route}.`,
          href: `/app/travel/trips/${params.tripId}`,
        });
      }
    } else if (params.initiatorRole === "traveler" && pkg) {
      // Traveler offered to carry → notify the sender.
      await notify(tx, {
        profileId: pkg.senderId,
        type: "offer_received",
        title: "A traveler offered to carry your package",
        body: route,
        href: `/app/packages/${params.packageId}`,
      });
    }
    return row;
  });
}

/** Requests for a package, with the counterpart trip + traveler joined in. */
export async function getRequestsForPackage(packageId: string) {
  return db
    .select({
      request: matchRequests,
      trip: trips,
      traveler: {
        id: profiles.id,
        fullName: profiles.fullName,
        avatar: profiles.avatar,
        trustScore: profiles.trustScore,
      },
    })
    .from(matchRequests)
    .leftJoin(trips, eq(matchRequests.tripId, trips.id))
    .leftJoin(profiles, eq(trips.travelerId, profiles.id))
    .where(eq(matchRequests.packageId, packageId))
    .orderBy(desc(matchRequests.createdAt));
}

/** Pending/all requests on a trip, with the package + sender joined in. */
export async function getRequestsForTrip(tripId: string) {
  return db
    .select({
      request: matchRequests,
      package: packages,
      sender: {
        id: profiles.id,
        fullName: profiles.fullName,
        ratingAvg: profiles.ratingAvg,
      },
    })
    .from(matchRequests)
    .innerJoin(packages, eq(matchRequests.packageId, packages.id))
    .innerJoin(profiles, eq(packages.senderId, profiles.id))
    .where(eq(matchRequests.tripId, tripId))
    .orderBy(desc(matchRequests.createdAt));
}

type Result = { ok: true } | { ok: false; error: string };

/** Traveler declines a request on their trip. */
export async function declineRequest(requestId: string, travelerId: string): Promise<Result> {
  return db.transaction(async (tx) => {
    const [req] = await tx.select().from(matchRequests).where(eq(matchRequests.id, requestId)).limit(1);
    if (!req || !req.tripId) return { ok: false, error: "Request not found" };
    const [trip] = await tx.select().from(trips).where(eq(trips.id, req.tripId)).limit(1);
    if (!trip || trip.travelerId !== travelerId) return { ok: false, error: "Not allowed" };
    if (req.status !== "pending") return { ok: false, error: "Already handled" };
    await tx
      .update(matchRequests)
      .set({ status: "declined", updatedAt: new Date() })
      .where(eq(matchRequests.id, requestId));
    await notify(tx, {
      profileId: req.requestedBy,
      type: "declined",
      title: "Request declined",
      body: "A traveler passed on your request — try another.",
      href: `/app/packages/${req.packageId}`,
    });
    return { ok: true };
  });
}

/**
 * Traveler accepts a request → confirm a match, atomically. Verifies the trip
 * belongs to the traveler, marks the request accepted, the package + trip
 * matched, declines competing requests, and mints a delivery OTP.
 */
export async function acceptRequest(requestId: string, travelerId: string) {
  return db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(matchRequests)
      .where(eq(matchRequests.id, requestId))
      .limit(1);
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Request already handled");

    const [pkg] = await tx
      .select()
      .from(packages)
      .where(eq(packages.id, req.packageId))
      .limit(1);
    if (!pkg) throw new Error("Package not found");

    const [trip] = req.tripId
      ? await tx.select().from(trips).where(eq(trips.id, req.tripId)).limit(1)
      : [undefined];

    if (!trip || trip.travelerId !== travelerId) throw new Error("Not allowed");

    const tooHeavy = capacityError(pkg.weightKg, trip.capacityKg);
    if (tooHeavy) throw new Error(tooHeavy);

    const base = req.counterAmount ?? req.amount;
    const detour = matchDetour(pkg, trip);
    const [match] = await tx
      .insert(matches)
      .values({
        packageId: pkg.id,
        tripId: req.tripId,
        senderId: pkg.senderId,
        travelerId,
        agreedPrice: base + detour.fee,
        detourKm: detour.km,
        detourFee: detour.fee,
        detourSelfCollect: detour.selfCollect,
        status: "confirmed",
        deliveryOtp: genOtp(),
      })
      .returning();

    await tx
      .update(matchRequests)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(matchRequests.id, requestId));

    // Decline any other pending requests on this package.
    await tx
      .update(matchRequests)
      .set({ status: "declined", updatedAt: new Date() })
      .where(
        and(
          eq(matchRequests.packageId, pkg.id),
          eq(matchRequests.status, "pending"),
        ),
      );

    await tx
      .update(packages)
      .set({ status: "matched", updatedAt: new Date() })
      .where(eq(packages.id, pkg.id));

    if (req.tripId) {
      await tx
        .update(trips)
        .set({ status: "matched", updatedAt: new Date() })
        .where(eq(trips.id, req.tripId));
    }

    return match;
  });
}

/** Sender declines a traveler's offer on their package. */
export async function declineOfferAsSender(requestId: string, senderId: string): Promise<Result> {
  return db.transaction(async (tx) => {
    const [req] = await tx.select().from(matchRequests).where(eq(matchRequests.id, requestId)).limit(1);
    if (!req) return { ok: false, error: "Request not found" };
    const [pkg] = await tx.select().from(packages).where(eq(packages.id, req.packageId)).limit(1);
    if (!pkg || pkg.senderId !== senderId) return { ok: false, error: "Not allowed" };
    if (req.status !== "pending") return { ok: false, error: "Already handled" };
    await tx
      .update(matchRequests)
      .set({ status: "declined", updatedAt: new Date() })
      .where(eq(matchRequests.id, requestId));
    await notify(tx, {
      profileId: req.requestedBy,
      type: "declined",
      title: "Offer declined",
      body: "The sender passed on your offer to carry.",
      href: req.tripId ? `/app/travel/trips/${req.tripId}` : "/app/travel",
    });
    return { ok: true };
  });
}

/**
 * Sender accepts a traveler's offer → confirm a match. Authorized by package
 * ownership; the traveler is derived from the offered trip. Mirrors
 * acceptRequest (declines competitors, marks package + trip matched, mints OTP).
 */
export async function acceptOfferAsSender(requestId: string, senderId: string) {
  return db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(matchRequests)
      .where(eq(matchRequests.id, requestId))
      .limit(1);
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Request already handled");

    const [pkg] = await tx.select().from(packages).where(eq(packages.id, req.packageId)).limit(1);
    if (!pkg) throw new Error("Package not found");
    if (pkg.senderId !== senderId) throw new Error("Not allowed");

    const [trip] = req.tripId
      ? await tx.select().from(trips).where(eq(trips.id, req.tripId)).limit(1)
      : [undefined];
    if (!trip) throw new Error("Trip no longer available");
    if (trip.status !== "active") throw new Error("Trip no longer available");

    const tooHeavy = capacityError(pkg.weightKg, trip.capacityKg);
    if (tooHeavy) throw new Error(tooHeavy);

    const base = req.counterAmount ?? req.amount;
    const detour = matchDetour(pkg, trip);
    const [match] = await tx
      .insert(matches)
      .values({
        packageId: pkg.id,
        tripId: req.tripId,
        senderId,
        travelerId: trip.travelerId,
        agreedPrice: base + detour.fee,
        detourKm: detour.km,
        detourFee: detour.fee,
        detourSelfCollect: detour.selfCollect,
        status: "confirmed",
        deliveryOtp: genOtp(),
      })
      .returning();

    await tx
      .update(matchRequests)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(matchRequests.id, requestId));

    // Decline any other pending requests on this package.
    await tx
      .update(matchRequests)
      .set({ status: "declined", updatedAt: new Date() })
      .where(and(eq(matchRequests.packageId, pkg.id), eq(matchRequests.status, "pending")));

    await tx
      .update(packages)
      .set({ status: "matched", updatedAt: new Date() })
      .where(eq(packages.id, pkg.id));

    await tx
      .update(trips)
      .set({ status: "matched", updatedAt: new Date() })
      .where(eq(trips.id, trip.id));

    return match;
  });
}

/** Ops manually pairs an unmatched package with a trip (concierge matching). */
export async function adminCreateMatch(
  actorId: string,
  packageId: string,
  tripId: string,
): Promise<{ ok: true; matchId: string } | { ok: false; error: string }> {
  return db.transaction(async (tx) => {
    const [pkg] = await tx.select().from(packages).where(eq(packages.id, packageId)).limit(1);
    if (!pkg) return { ok: false, error: "Package not found" };
    if (pkg.status !== "active") return { ok: false, error: "Package is not open for matching" };
    const [trip] = await tx.select().from(trips).where(eq(trips.id, tripId)).limit(1);
    if (!trip) return { ok: false, error: "Trip not found" };
    if (trip.status !== "active") return { ok: false, error: "Trip is not active" };
    if (trip.travelerId === pkg.senderId) return { ok: false, error: "Sender and traveller are the same person" };
    const tooHeavy = capacityError(pkg.weightKg, trip.capacityKg);
    if (tooHeavy) return { ok: false, error: tooHeavy };

    const base = pkg.offerPrice ?? pkg.maxPrice ?? 0;
    const detour = matchDetour(pkg, trip);
    const [match] = await tx
      .insert(matches)
      .values({
        packageId: pkg.id,
        tripId: trip.id,
        senderId: pkg.senderId,
        travelerId: trip.travelerId,
        agreedPrice: base + detour.fee,
        detourKm: detour.km,
        detourFee: detour.fee,
        detourSelfCollect: detour.selfCollect,
        status: "confirmed",
        deliveryOtp: genOtp(),
      })
      .returning();

    await tx.update(packages).set({ status: "matched", updatedAt: new Date() }).where(eq(packages.id, pkg.id));
    await tx.update(trips).set({ status: "matched", updatedAt: new Date() }).where(eq(trips.id, trip.id));
    await notify(tx, {
      profileId: pkg.senderId,
      type: "package_match",
      title: "We found you a match!",
      body: `Quiko matched your package on ${pkg.fromCity} → ${pkg.toCity} with a traveller.`,
      href: `/app/packages/${pkg.id}`,
    });
    await notify(tx, {
      profileId: trip.travelerId,
      type: "trip_match",
      title: "New delivery matched",
      body: `A package on your ${trip.fromCity} → ${trip.toCity} route was matched to you.`,
      href: `/app/travel/trips/${trip.id}`,
    });
    await logAdminAction(tx, { actorId, action: "match.create", targetType: "match", targetId: match.id, detail: `${packageId} × ${tripId}` });
    return { ok: true, matchId: match.id };
  });
}

/**
 * The live match for a package, if any (with traveler joined). Cancelled matches
 * are ignored so a cancelled package reverts to the "find travellers" state.
 */
export async function getMatchForPackage(packageId: string) {
  const [row] = await db
    .select({
      match: matches,
      traveler: {
        id: profiles.id,
        fullName: profiles.fullName,
        avatar: profiles.avatar,
        trustScore: profiles.trustScore,
      },
    })
    .from(matches)
    .innerJoin(profiles, eq(matches.travelerId, profiles.id))
    .where(and(eq(matches.packageId, packageId), ne(matches.status, "cancelled")))
    .orderBy(desc(matches.createdAt))
    .limit(1);
  return row ?? null;
}

/** Cancelled matches on a package — shown as history so the sender has a record. */
export async function getCancelledMatchesForPackage(packageId: string) {
  return db
    .select({
      match: matches,
      traveler: { id: profiles.id, fullName: profiles.fullName },
    })
    .from(matches)
    .innerJoin(profiles, eq(matches.travelerId, profiles.id))
    .where(and(eq(matches.packageId, packageId), eq(matches.status, "cancelled")))
    .orderBy(desc(matches.updatedAt));
}

/** Package ids the sender has already sent a request for (to hide "Request" CTA). */
export async function getRequestedTripIds(packageId: string) {
  const rows = await db
    .select({ tripId: matchRequests.tripId })
    .from(matchRequests)
    .where(
      and(
        eq(matchRequests.packageId, packageId),
        inArray(matchRequests.status, ["pending", "accepted"]),
      ),
    );
  return new Set(rows.map((r) => r.tripId).filter(Boolean) as string[]);
}
