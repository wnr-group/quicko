import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { getMatchThread, sendMessage, sendLocationMessage } from "@/lib/queries/messages";

const hhmm = (d: Date) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export async function GET(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { matchId } = await params;
  const t = await getMatchThread(matchId, u.id);
  if (!t) return bad("Not found", 404);
  return ok({
    counterpartName: t.counterpart.fullName ?? "Your match",
    fromCity: t.route.fromCity,
    toCity: t.route.toCity,
    messages: t.messages.map((m) => ({
      id: m.id, mine: m.senderId === u.id, body: m.body ?? "", at: hhmm(m.createdAt),
      location: m.lat != null && m.lng != null ? { lat: m.lat, lng: m.lng, label: m.locationLabel ?? "Shared location" } : null,
    })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { matchId } = await params;
  const { body, location } = (await req.json().catch(() => ({}))) as {
    body?: string;
    location?: { lat: number; lng: number; label?: string };
  };
  const res = location
    ? await sendLocationMessage(matchId, u.id, location.lat, location.lng, location.label ?? "")
    : await sendMessage(matchId, u.id, body ?? "");
  return res.ok ? ok({ ok: true }) : bad(res.error);
}
