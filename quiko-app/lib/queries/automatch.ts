import "server-only";
import { db } from "@/db";
import { explorePackages } from "@/lib/queries/packages";
import { findMatchingTrips } from "@/lib/queries/trips";
import { notify } from "@/lib/queries/notifications";

/**
 * Auto-match alerts ("notify me"). When a new trip or open package appears we
 * search the other side of the book and ping anyone whose posting now matches —
 * the async-marketplace equivalent of a saved-search alert.
 */

/** A traveler just posted a trip → alert senders of open packages on its route. */
export async function notifyMatchesForNewTrip(trip: {
  id: string;
  travelerId: string;
  fromCity: string;
  toCity: string;
  fromLat: number | null;
  fromLng: number | null;
  toLat: number | null;
  toLng: number | null;
  travelDate: string;
  capacityKg: number;
}): Promise<number> {
  if (trip.fromLat == null || trip.fromLng == null || trip.toLat == null || trip.toLng == null) {
    return 0;
  }
  const matches = await explorePackages({
    tripId: trip.id,
    travelerId: trip.travelerId,
    fromLat: trip.fromLat,
    fromLng: trip.fromLng,
    toLat: trip.toLat,
    toLng: trip.toLng,
    tripDate: trip.travelDate,
    capacityKg: trip.capacityKg,
  });

  let sent = 0;
  for (const { package: pkg } of matches) {
    if (pkg.senderId === trip.travelerId) continue; // don't alert yourself
    await notify(db, {
      profileId: pkg.senderId,
      type: "trip_match",
      title: "A traveler on your route! 🚀",
      body: `${trip.fromCity} → ${trip.toCity} just posted a trip. Tap to send a request.`,
      href: `/app/packages/${pkg.id}/travelers`,
    });
    sent++;
  }
  return sent;
}

/** A sender left an open package → alert travelers with a matching active trip. */
export async function notifyMatchesForNewPackage(pkg: {
  id: string;
  senderId: string;
  fromCity: string;
  toCity: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  travelDate: string;
  dateTo: string | null;
  weightKg: number;
}): Promise<number> {
  const trips = await findMatchingTrips({
    senderId: pkg.senderId,
    fromLat: pkg.fromLat,
    fromLng: pkg.fromLng,
    toLat: pkg.toLat,
    toLng: pkg.toLng,
    travelDate: pkg.travelDate,
    dateTo: pkg.dateTo,
    weightKg: pkg.weightKg,
  });

  let sent = 0;
  for (const { trip } of trips) {
    if (trip.travelerId === pkg.senderId) continue; // don't alert yourself
    await notify(db, {
      profileId: trip.travelerId,
      type: "package_match",
      title: "New package on your route 📦",
      body: `${pkg.fromCity} → ${pkg.toCity} needs a traveler — you could carry it.`,
      href: `/app/travel/trips/${trip.id}/packages`,
    });
    sent++;
  }
  return sent;
}
