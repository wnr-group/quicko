import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { rateTraveler } from "@/lib/queries/matches";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { id } = await params;
  const { stars, comment } = (await req.json().catch(() => ({}))) as { stars?: number; comment?: string };
  const s = Number(stars);
  if (s < 1 || s > 5) return bad("Pick 1–5 stars");
  const res = await rateTraveler(id, u.id, s, (comment ?? "").trim() || null);
  return res.ok ? ok({ ok: true }) : bad(res.error);
}
