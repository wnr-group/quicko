import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { getMySupport, postUserSupportMessage } from "@/lib/queries/support";

// Mobile client — the signed-in user's support conversation.
export async function GET(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const { thread, messages } = await getMySupport(u.id);
  return ok({
    status: thread?.status ?? null,
    messages: messages.map((m) => ({ id: m.id, fromStaff: m.fromStaff, body: m.body ?? "", at: m.createdAt })),
  });
}

export async function POST(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const body = await req.json().catch(() => ({}));
  const res = await postUserSupportMessage(u.id, String(body?.body ?? ""));
  return res.ok ? ok({ ok: true }) : bad(res.error);
}
