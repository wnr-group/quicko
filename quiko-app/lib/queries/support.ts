import "server-only";
import { desc, eq, inArray, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { supportThreads, supportMessages, profiles } from "@/db/schema";
import { notify } from "@/lib/queries/notifications";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Result = { ok: true } | { ok: false; error: string };

async function latestThreadFor(exec: Tx | typeof db, userId: string) {
  const [t] = await exec
    .select()
    .from(supportThreads)
    .where(eq(supportThreads.userId, userId))
    .orderBy(desc(supportThreads.lastMessageAt))
    .limit(1);
  return t ?? null;
}

/** The signed-in user's support conversation (their latest thread, any status). */
export async function getMySupport(userId: string) {
  const thread = await latestThreadFor(db, userId);
  if (!thread) return { thread: null, messages: [] as (typeof supportMessages.$inferSelect)[] };
  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.threadId, thread.id))
    .orderBy(asc(supportMessages.createdAt));
  return { thread, messages };
}

/** User posts a message; opens a thread if none, and reopens a resolved one. */
export async function postUserSupportMessage(userId: string, body: string): Promise<Result> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Message is empty" };
  if (text.length > 2000) return { ok: false, error: "Message too long" };
  await db.transaction(async (tx) => {
    let thread = await latestThreadFor(tx, userId);
    if (!thread) {
      [thread] = await tx.insert(supportThreads).values({ userId }).returning();
    }
    await tx.insert(supportMessages).values({ threadId: thread.id, senderId: userId, fromStaff: false, body: text });
    await tx
      .update(supportThreads)
      .set({ lastMessageAt: new Date(), updatedAt: new Date(), status: "open" })
      .where(eq(supportThreads.id, thread.id));
  });
  return { ok: true };
}

/** Customer resolves or reopens their own thread. */
export async function setMySupportStatus(userId: string, threadId: string, status: "open" | "closed"): Promise<Result> {
  const [t] = await db.select().from(supportThreads).where(eq(supportThreads.id, threadId)).limit(1);
  if (!t || t.userId !== userId) return { ok: false, error: "Thread not found" };
  await db.update(supportThreads).set({ status, updatedAt: new Date() }).where(eq(supportThreads.id, threadId));
  return { ok: true };
}

/** Support console: threads in a queue with the user and a last-message preview. */
export async function listSupportThreads(status: "open" | "closed" = "open") {
  const rows = await db
    .select({
      thread: supportThreads,
      user: { id: profiles.id, fullName: profiles.fullName, phone: profiles.phone },
    })
    .from(supportThreads)
    .innerJoin(profiles, eq(supportThreads.userId, profiles.id))
    .where(eq(supportThreads.status, status))
    .orderBy(desc(supportThreads.lastMessageAt))
    .limit(200);

  const ids = rows.map((r) => r.thread.id);
  const recent = ids.length
    ? await db
        .select({ threadId: supportMessages.threadId, body: supportMessages.body, fromStaff: supportMessages.fromStaff, createdAt: supportMessages.createdAt })
        .from(supportMessages)
        .where(inArray(supportMessages.threadId, ids))
        .orderBy(desc(supportMessages.createdAt))
    : [];
  const lastByThread = new Map<string, (typeof recent)[number]>();
  for (const m of recent) if (!lastByThread.has(m.threadId)) lastByThread.set(m.threadId, m);

  return rows.map((r) => ({ ...r, last: lastByThread.get(r.thread.id) ?? null }));
}

/** Support console: one thread with its user and full message history. */
export async function getSupportThread(threadId: string) {
  const [row] = await db
    .select({
      thread: supportThreads,
      user: { id: profiles.id, fullName: profiles.fullName, phone: profiles.phone },
    })
    .from(supportThreads)
    .innerJoin(profiles, eq(supportThreads.userId, profiles.id))
    .where(eq(supportThreads.id, threadId))
    .limit(1);
  if (!row) return null;
  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.threadId, threadId))
    .orderBy(asc(supportMessages.createdAt));
  return { ...row, messages };
}

/** Staff replies to a thread; assigns it to them and notifies the user. */
export async function postStaffReply(threadId: string, staffId: string, body: string): Promise<Result> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Message is empty" };
  if (text.length > 2000) return { ok: false, error: "Message too long" };
  return db.transaction(async (tx) => {
    const [thread] = await tx.select().from(supportThreads).where(eq(supportThreads.id, threadId)).limit(1);
    if (!thread) return { ok: false, error: "Thread not found" };
    await tx.insert(supportMessages).values({ threadId, senderId: staffId, fromStaff: true, body: text });
    await tx
      .update(supportThreads)
      .set({ lastMessageAt: new Date(), updatedAt: new Date(), status: "open", assignedTo: thread.assignedTo ?? staffId })
      .where(eq(supportThreads.id, threadId));
    await notify(tx, {
      profileId: thread.userId,
      type: "support",
      title: "Quiko Support replied",
      body: text.length > 80 ? `${text.slice(0, 80)}…` : text,
      href: "/app/support",
    });
    return { ok: true };
  });
}

/** Staff closes or reopens a thread. */
export async function setSupportThreadStatus(threadId: string, status: "open" | "closed"): Promise<Result> {
  await db.update(supportThreads).set({ status, updatedAt: new Date() }).where(eq(supportThreads.id, threadId));
  return { ok: true };
}

/** Count of open support threads (console badge / admin dashboard). */
export async function countOpenSupport(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(supportThreads)
    .where(eq(supportThreads.status, "open"));
  return row?.n ?? 0;
}
