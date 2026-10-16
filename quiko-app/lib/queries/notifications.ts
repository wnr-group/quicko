import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

// Accepts either the top-level db or a transaction handle, so lifecycle
// mutations can emit a notification atomically with the state change.
type Exec = Pick<typeof db, "insert">;

export type NotifyInput = {
  profileId: string;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
};

export async function notify(exec: Exec, input: NotifyInput) {
  await exec.insert(notifications).values({
    profileId: input.profileId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    data: input.href ? { href: input.href } : null,
  });
}

export async function listNotifications(profileId: string, limit = 40) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.profileId, profileId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function unreadCount(profileId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.profileId, profileId), eq(notifications.read, false)));
  return Number(row?.n ?? 0);
}

export async function markAllRead(profileId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.profileId, profileId), eq(notifications.read, false)));
}

/** Unread chat messages per match (message notifications link to /app/chat/<matchId>). */
export async function unreadMessagesByMatch(profileId: string): Promise<Record<string, number>> {
  const href = sql<string>`${notifications.data}->>'href'`;
  const rows = await db
    .select({ href, n: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.profileId, profileId), eq(notifications.type, "message"), eq(notifications.read, false)),
    )
    .groupBy(href);
  const out: Record<string, number> = {};
  for (const r of rows) {
    const id = r.href?.split("/app/chat/")[1];
    if (id) out[id] = Number(r.n);
  }
  return out;
}

/** Total unread chat messages (the Messages tab badge). */
export async function unreadMessageCount(profileId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.profileId, profileId), eq(notifications.type, "message"), eq(notifications.read, false)),
    );
  return Number(row?.n ?? 0);
}

/** Opening a chat reads its messages. */
export async function markChatRead(profileId: string, matchId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.profileId, profileId),
        eq(notifications.type, "message"),
        eq(notifications.read, false),
        sql`${notifications.data}->>'href' = ${`/app/chat/${matchId}`}`,
      ),
    );
}
