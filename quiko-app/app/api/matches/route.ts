import { bearerUser, ok, unauth } from "@/lib/apiAuth";
import { getUserMatches } from "@/lib/queries/matches";

export async function GET(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const rows = await getUserMatches(u.id);
  return ok(
    rows.map((r) => ({
      id: r.match.id,
      role: r.role,
      fromCity: r.package.fromCity,
      toCity: r.package.toCity,
      counterpartName: r.counterpart.fullName ?? "—",
      status: r.match.status,
      price: r.match.agreedPrice,
    })),
  );
}
