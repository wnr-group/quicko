import Link from "next/link";
import { listOpenReports } from "@/lib/queries/reports";
import { getProfile, isAdminProfile } from "@/lib/auth";
import { ModerationActions } from "@/components/ModerationActions";
import { initials, timeAgo } from "@/core/format";

const TYPE_LABELS: Record<string, string> = {
  user: "Behaviour", prohibited: "Prohibited item", auto_contact: "Shared contact info",
};

export default async function AdminModerationPage() {
  const admin = isAdminProfile(await getProfile());
  const items = await listOpenReports();

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Moderation</h1>
      <p className="text-sm text-muted">{items.length} open report{items.length === 1 ? "" : "s"}.</p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center text-sm text-muted">
          Nothing to review. 🎉
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {items.map(({ report, reporter, reported, route }) => (
            <div key={report.id} className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-xs font-bold text-ink">
                  {initials(reported?.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-error-soft px-2 py-0.5 text-[11px] font-bold text-error">
                      {TYPE_LABELS[report.type] ?? report.type}
                    </span>
                    {reported && (
                      <Link href={`/admin/users/${reported.id}`} className="font-bold underline">
                        {reported.fullName ?? "user"}
                      </Link>
                    )}
                    {reported?.status === "suspended" && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">Suspended</span>
                    )}
                  </div>
                  {report.detail && <p className="mt-1 text-[14px] text-ink">{report.detail}</p>}
                  <p className="mt-1 text-[12px] text-muted">
                    {report.reporterId ? `Reported by ${reporter?.fullName ?? "a user"}` : "Auto-flagged"}
                    {route ? ` · ${route.fromCity} → ${route.toCity}` : ""} · {timeAgo(report.createdAt)}
                    {report.matchId ? " · " : ""}
                    {report.matchId && <Link href={`/admin/matches/${report.matchId}`} className="underline">match</Link>}
                  </p>
                  <ModerationActions reportId={report.id} canSuspend={!!reported} admin={admin} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
