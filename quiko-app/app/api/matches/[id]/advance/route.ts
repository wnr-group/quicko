import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { advanceMatchAsTraveler } from "@/lib/queries/matches";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { id } = await params;
  const { to, photo, otp } = (await req.json().catch(() => ({}))) as { to?: "picked_up" | "in_transit"; photo?: string; otp?: string };
  if (to !== "picked_up" && to !== "in_transit") return bad("Invalid transition");
  const res = await advanceMatchAsTraveler(id, u.id, to, photo, (otp ?? "").trim());
  return res.ok ? ok({ ok: true }) : bad(res.error);
}
