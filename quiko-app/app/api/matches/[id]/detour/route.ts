import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { setDetourOptOut } from "@/lib/queries/matches";

// Sender toggles the traveller's detour (door-service ↔ self-collect) before paying.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const res = await setDetourOptOut(id, u.id, Boolean(body?.optedOut));
  return res.ok ? ok({ ok: true }) : bad(res.error);
}
