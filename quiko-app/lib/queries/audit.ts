import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, adminActions } from "@/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Write one audit row. Call inside the same tx as the mutation. */
export async function logAdminAction(
  exec: Tx | typeof db,
  input: { actorId: string; action: string; targetType?: string; targetId?: string; detail?: string },
) {
  await exec.insert(adminActions).values({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    detail: input.detail,
  });
}

/** Recent audit-log entries. */
export async function listAdminActions(limit = 100) {
  return db
    .select({
      action: adminActions,
      actor: { id: profiles.id, fullName: profiles.fullName },
    })
    .from(adminActions)
    .innerJoin(profiles, eq(adminActions.actorId, profiles.id))
    .orderBy(desc(adminActions.createdAt))
    .limit(limit);
}
