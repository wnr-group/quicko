import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { getUserMatches } from "@/lib/queries/matches";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { id } = await params;

  const row = (await getUserMatches(u.id)).find((r) => r.match.id === id);
  if (!row) return bad("Match not found", 404);

  return ok({
    id: row.match.id,
    role: row.role,
    fromCity: row.package.fromCity,
    toCity: row.package.toCity,
    counterpartName: row.counterpart.fullName ?? "—",
    status: row.match.status,
    price: row.match.agreedPrice,
    weightKg: row.package.weightKg,
    // Only the sender shares the OTP; the traveller enters what the receiver gives them.
    otp: row.role === "sender" ? row.match.deliveryOtp ?? "" : "",
    receiverName: row.package.receiverName,
    receiverPhone: row.package.receiverPhone,
  });
}
