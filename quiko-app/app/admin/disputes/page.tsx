import Link from "next/link";
import { listOpenDisputes } from "@/lib/queries/disputes";
import { Empty } from "@/components/adminkit";
import { inr, initials, timeAgo } from "@/core/format";

const REASON_LABELS: Record<string, string> = {
  lost: "Package lost", damaged: "Damaged", wrong_otp: "OTP issue", no_show: "Traveller no-show", other: "Other",
};

export default async function AdminDisputesPage() {
  const items = await listOpenDisputes();

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Disputes</h1>
      <p className="text-sm text-muted">{items.length} open.</p>

      {items.length === 0 ? (
        <Empty>No open disputes. 🎉</Empty>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          {items.map(({ dispute, route, raiser, agreedPrice }) => (
            <Link
              key={dispute.id}
              href={`/admin/matches/${dispute.matchId}`}
              className="grid items-center gap-4 rounded-2xl border-l-2 border-error bg-canvas p-4 shadow-card transition-colors hover:bg-brand-soft lg:grid-cols-[minmax(0,1fr)_180px_160px_auto]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-error-soft text-xs font-bold text-error">
                  {initials(raiser.fullName)}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-bold">
                    {route.fromCity} &rarr; {route.toCity}
                  </div>
                  <div className="truncate text-[13px] text-muted">
                    raised by {raiser.fullName ?? "—"}
                  </div>
                </div>
              </div>

              <div>
                <span className="rounded-full bg-error-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-error">
                  {REASON_LABELS[dispute.reason] ?? dispute.reason}
                </span>
              </div>

              <div className="text-[13px] font-semibold tabular-nums">
                {inr(agreedPrice)}
                <span className="font-normal text-muted"> held</span>
              </div>

              <span className="shrink-0 text-[12px] tabular-nums text-muted">
                {timeAgo(dispute.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
