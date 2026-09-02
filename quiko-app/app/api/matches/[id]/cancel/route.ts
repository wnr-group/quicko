import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { cancelMatchAsParticipant } from "@/lib/queries/matches";

// Either participant cancels a match before pickup (refunds the sender if paid).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { id } = await params;
  const res = await cancelMatchAsParticipant(id, u.id);
  return res.ok ? ok({ ok: true }) : bad(res.error);
}
