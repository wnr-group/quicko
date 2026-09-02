import { bearerUser, ok, unauth } from "@/lib/apiAuth";
import { unreadCount } from "@/lib/queries/notifications";

export async function GET(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  return ok(await unreadCount(u.id));
}
