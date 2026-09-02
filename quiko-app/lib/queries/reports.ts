import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { reports, profiles, matches, packages } from "@/db/schema";
import { notify } from "@/lib/queries/notifications";
import { logAdminAction } from "@/lib/queries/audit";
import { setUserStatus } from "@/lib/queries/adminOps";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Result = { ok: true } | { ok: false; error: string };
type ReportType = "user" | "prohibited";

/** A user reports their counterpart (abuse) or a package (prohibited items). */
export async function createReport(
  reporterId: string,
  input: { reportedUserId?: string; matchId?: string; type: ReportType; detail: string },
): Promise<Result> {
  if (input.reportedUserId && input.reportedUserId === reporterId) return { ok: false, error: "You can't report yourself" };
  await db.insert(reports).values({
    reporterId,
    reportedUserId: input.reportedUserId,
    matchId: input.matchId,
    type: input.type,
    detail: input.detail.trim() || null,
  });
  return { ok: true };
}

/**
 * System auto-flag: a chat message was blocked for sharing contact info. Deduped
 * to one open flag per (user, match). Called inside sendMessage's flow.
 */
export async function autoFlagContact(exec: Tx | typeof db, reportedUserId: string, matchId: string) {
  const [existing] = await exec
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.reportedUserId, reportedUserId), eq(reports.matchId, matchId), eq(reports.type, "auto_contact"), eq(reports.status, "open")))
    .limit(1);
  if (existing) return;
  await exec.insert(reports).values({
    reporterId: null,
    reportedUserId,
    matchId,
    type: "auto_contact",
    detail: "Tried to share a phone number in chat",
  });
}

/** Open reports queue for the moderation console. */
export async function listOpenReports() {
  const reporter = alias(profiles, "reporter");
  const reported = alias(profiles, "reported");
  return db
    .select({
      report: reports,
      reporter: { id: reporter.id, fullName: reporter.fullName },
      reported: { id: reported.id, fullName: reported.fullName, status: reported.status },
      route: { fromCity: packages.fromCity, toCity: packages.toCity },
    })
    .from(reports)
    .leftJoin(reporter, eq(reports.reporterId, reporter.id))
    .leftJoin(reported, eq(reports.reportedUserId, reported.id))
    .leftJoin(matches, eq(reports.matchId, matches.id))
    .leftJoin(packages, eq(matches.packageId, packages.id))
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt))
    .limit(200);
}

export async function countOpenReports(): Promise<number> {
  const rows = await db.select({ id: reports.id }).from(reports).where(eq(reports.status, "open"));
  return rows.length;
}

/** Ops resolves a report: warn the user, suspend them, or dismiss the report. */
export async function actionReport(actorId: string, reportId: string, action: "warn" | "suspend" | "dismiss"): Promise<Result> {
  const [r] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!r) return { ok: false, error: "Report not found" };
  if (r.status !== "open") return { ok: false, error: "Already handled" };

  if (action === "suspend") {
    if (!r.reportedUserId) return { ok: false, error: "No user to suspend" };
    const res = await setUserStatus(actorId, r.reportedUserId, "suspended");
    if (!res.ok) return res;
  }

  return db.transaction(async (tx) => {
    if (action === "warn" && r.reportedUserId) {
      await notify(tx, {
        profileId: r.reportedUserId,
        type: "warning",
        title: "A note from Quiko",
        body: "We've received a report about your recent activity. Please follow our community guidelines to keep your account in good standing.",
      });
    }
    await tx
      .update(reports)
      .set({ status: action === "dismiss" ? "dismissed" : "actioned", resolution: action, handledBy: actorId, updatedAt: new Date() })
      .where(eq(reports.id, reportId));
    await logAdminAction(tx, { actorId, action: `report.${action}`, targetType: "report", targetId: reportId });
    return { ok: true };
  });
}
