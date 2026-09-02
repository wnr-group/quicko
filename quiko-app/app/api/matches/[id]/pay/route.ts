import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { payForMatch } from "@/lib/queries/matches";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { id } = await params;
  const res = await payForMatch(id, u.id);
  // simulated → { ok }; cashfree → { ok, checkout: { paymentSessionId, orderId } }
  return res.ok ? ok({ ok: true, checkout: res.checkout }) : bad(res.error);
}
