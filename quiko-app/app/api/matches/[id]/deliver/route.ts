import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { confirmDelivery } from "@/lib/queries/matches";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { id } = await params;
  const { otp, photo } = (await req.json().catch(() => ({}))) as { otp?: string; photo?: string };
  const res = await confirmDelivery(id, u.id, (otp ?? "").trim(), photo);
  return res.ok ? ok({ ok: true }) : bad(res.error);
}
