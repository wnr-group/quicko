import { bearerUser, ok, unauth } from "@/lib/apiAuth";
import { exploreTrips } from "@/lib/queries/trips";

export async function GET(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();

  const q = new URL(req.url).searchParams;
  const num = (k: string) => Number(q.get(k));
  if (["fromLat", "fromLng", "toLat", "toLng"].some((k) => Number.isNaN(num(k)))) {
    return ok([]);
  }

  const today = new Date();
  const dateFrom = today.toISOString().slice(0, 10);
  const dateTo = new Date(today.getTime() + 30 * 864e5).toISOString().slice(0, 10);

  const rows = await exploreTrips({
    fromLat: num("fromLat"), fromLng: num("fromLng"),
    toLat: num("toLat"), toLng: num("toLng"),
    dateFrom, dateTo,
  });

  return ok(
    rows.map(({ trip, traveler }) => ({
      id: trip.id,
      travelerName: traveler.fullName ?? "Traveller",
      transport: trip.transport,
      travelDate: trip.travelDate,
      arriveDate: trip.arriveDate,
      departTime: trip.departTime,
      arriveTime: trip.arriveTime,
    })),
  );
}
