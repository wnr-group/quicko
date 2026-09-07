import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { getMyPackages, createPackage } from "@/lib/queries/packages";
import { sendRequest, capacityError, selfMatchError, travellerVerificationError } from "@/lib/queries/requests";
import { getTrip } from "@/lib/queries/trips";
import { createPackageSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const rows = await getMyPackages(u.id);
  return ok(
    rows.map((p) => ({ id: p.id, fromCity: p.fromCity, toCity: p.toCity, weightKg: p.weightKg, status: p.status })),
  );
}

export async function POST(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const today = new Date().toISOString().slice(0, 10);
  const input = {
    fromLabel: String(b.fromLabel ?? b.fromCity ?? ""),
    fromLat: Number(b.fromLat),
    fromLng: Number(b.fromLng),
    toLabel: String(b.toLabel ?? b.toCity ?? ""),
    toLat: Number(b.toLat),
    toLng: Number(b.toLng),
    travelDate: today,
    weightKg: Number(b.weightKg ?? 1),
    timePreference: "flexible" as const,
    description: String(b.description ?? ""),
    offerPrice: 1_000_000, // clamped to the computed max price server-side
  };

  const parsed = createPackageSchema.safeParse(input);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input");

  // Reject a package the chosen traveller can't carry before creating anything.
  const tripId = b.tripId ? String(b.tripId) : undefined;
  const chosen = tripId ? await getTrip(tripId) : null;
  if (chosen) {
    const isSelf = selfMatchError(u.id, chosen.travelerId);
    if (isSelf) return bad(isSelf);
    const tooHeavy = capacityError(parsed.data.weightKg, chosen.capacityKg);
    if (tooHeavy) return bad(tooHeavy);
    const unverified = await travellerVerificationError(chosen.travelerId);
    if (unverified) return bad(unverified);
  }

  const pkg = await createPackage(u.id, parsed.data);

  if (tripId) {
    const trip = chosen;
    if (trip && trip.status === "active") {
      await sendRequest({
        packageId: pkg.id,
        tripId,
        requestedBy: u.id,
        initiatorRole: "sender",
        amount: Math.min(pkg.offerPrice, pkg.maxPrice),
      });
    }
  }
  return ok({ ok: true, id: pkg.id });
}
