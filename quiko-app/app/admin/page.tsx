import Link from "next/link";
import { getPlatformStats, countUnmatchedPackages, getOpsMetrics } from "@/lib/queries/admin";
import { countPendingKyc } from "@/lib/queries/kyc";
import { countOpenSupport } from "@/lib/queries/support";
import { countOpenDisputes } from "@/lib/queries/disputes";
import { countOpenReports } from "@/lib/queries/reports";
import { getProfile, isAdminProfile } from "@/lib/auth";
import { inr } from "@/core/format";

export default async function AdminDashboard() {
  const admin = isAdminProfile(await getProfile());
  const [stats, pendingKyc, openSupport, openDisputes, openReports, unmatched, metrics] = await Promise.all([
    getPlatformStats(),
    countPendingKyc(),
    countOpenSupport(),
    countOpenDisputes(),
    countOpenReports(),
    countUnmatchedPackages(),
    getOpsMetrics(),
  ]);

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
      <p className="text-sm text-muted">Platform overview.</p>

      {openDisputes > 0 && (
        <Link href="/admin/disputes"
          className="mt-4 flex items-center justify-between rounded-2xl bg-error-soft p-4 shadow-card active:scale-[0.99]">
          <span className="font-bold text-error">
            {openDisputes} open dispute{openDisputes > 1 ? "s" : ""} need resolving
          </span>
          <span className="text-sm font-bold text-error">Resolve →</span>
        </Link>
      )}

      {openReports > 0 && (
        <Link href="/admin/moderation"
          className="mt-4 flex items-center justify-between rounded-2xl bg-error-soft p-4 shadow-card active:scale-[0.99]">
          <span className="font-bold text-error">
            {openReports} safety report{openReports > 1 ? "s" : ""} to review
          </span>
          <span className="text-sm font-bold text-error">Review →</span>
        </Link>
      )}

      {admin && pendingKyc > 0 && (
        <Link href="/admin/kyc"
          className="mt-4 flex items-center justify-between rounded-2xl bg-brand p-4 shadow-card active:scale-[0.99]">
          <span className="font-bold">
            {pendingKyc} KYC submission{pendingKyc > 1 ? "s" : ""} awaiting review
          </span>
          <span className="text-sm font-bold">Review →</span>
        </Link>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <Stat label="Users" value={stats.users} />
        <Stat label="Packages" value={stats.packages} />
        <Stat label="Trips" value={stats.trips} />
        <Stat label="Matches" value={stats.matches} />
        <Stat label="Deliveries" value={stats.delivered} />
        <Stat label="Pending KYC" value={pendingKyc} />
        {admin && <Stat label="GMV" value={inr(stats.gmv)} />}
        {admin && <Stat label="Commission (2%)" value={inr(stats.commission)} />}
      </div>

      {admin && (
        <>
          <h2 className="mb-3 mt-8 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-ink">
            Operational metrics
            <span className="h-px flex-1 bg-line" />
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Match rate" value={`${metrics.matchRate}%`} />
            <Stat label="Delivery success" value={`${metrics.successRate}%`} />
            <Stat label="Cancel rate" value={`${metrics.cancelRate}%`} />
            <Stat label="Avg time-to-match" value={`${metrics.avgTimeToMatchHours}h`} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <RouteList title="Demand — open packages" rows={metrics.demand} tone="brand" />
            <RouteList title="Supply — active trips" rows={metrics.supply} tone="ink" />
          </div>
        </>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/disputes" className="rounded-2xl bg-canvas p-4 text-center font-semibold shadow-card transition-transform active:scale-[0.99]">
          Disputes{openDisputes > 0 ? ` (${openDisputes})` : ""}
        </Link>
        <Link href="/admin/moderation" className="rounded-2xl bg-canvas p-4 text-center font-semibold shadow-card transition-transform active:scale-[0.99]">
          Moderation{openReports > 0 ? ` (${openReports})` : ""}
        </Link>
        <Link href="/support" className="rounded-2xl bg-canvas p-4 text-center font-semibold shadow-card transition-transform active:scale-[0.99]">
          Support{openSupport > 0 ? ` (${openSupport})` : ""}
        </Link>
        {admin && (
          <Link href="/admin/matching" className="rounded-2xl bg-canvas p-4 text-center font-semibold shadow-card transition-transform active:scale-[0.99]">
            Matching{unmatched > 0 ? ` (${unmatched})` : ""}
          </Link>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border-l-2 border-brand bg-canvas px-3.5 py-3 shadow-card">
      <div className="truncate text-[11px] font-bold uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-black leading-none tabular-nums">{value}</div>
    </div>
  );
}

function RouteList({ title, rows, tone }: { title: string; rows: { route: string; n: number }[]; tone: "brand" | "ink" }) {
  return (
    <div className="rounded-2xl bg-canvas p-4 shadow-card">
      <div className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-ink">{title}</div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-muted">None.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <li key={r.route} className="flex items-center justify-between text-[13px]">
              <span className="truncate font-semibold">{r.route}</span>
              <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone === "brand" ? "bg-brand text-ink" : "bg-ink text-brand"}`}>
                {r.n}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
