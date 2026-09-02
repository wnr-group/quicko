import { bearerUser, ok, unauth } from "@/lib/apiAuth";
import { markAllRead } from "@/lib/queries/notifications";

export async function POST(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  await markAllRead(u.id);
  return ok({ ok: true });
}
