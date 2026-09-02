import { bearerUser, ok, unauth } from "@/lib/apiAuth";
import { listNotifications } from "@/lib/queries/notifications";
import { timeAgo } from "@/core/format";

export async function GET(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const items = (await listNotifications(u.id)).filter((n) => n.type !== "matched"); // matches live in the Matches tab
  return ok(
    items.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body ?? "", at: timeAgo(n.createdAt), read: n.read })),
  );
}
