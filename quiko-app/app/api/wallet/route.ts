import { bearerUser, ok, unauth } from "@/lib/apiAuth";
import { getTravelerWallet } from "@/lib/queries/matches";
import { timeAgo } from "@/core/format";

export async function GET(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const w = await getTravelerWallet(u.id);
  return ok({
    earned: w.earned,
    pending: w.pending,
    deliveries: w.deliveries,
    payouts: w.payouts.map((p) => ({ id: p.id, amount: p.amount, fromCity: p.fromCity, toCity: p.toCity, at: timeAgo(p.createdAt) })),
    upcoming: w.upcoming.map((u2) => ({ id: u2.id, amount: u2.amount, status: u2.status, fromCity: u2.fromCity, toCity: u2.toCity })),
  });
}
