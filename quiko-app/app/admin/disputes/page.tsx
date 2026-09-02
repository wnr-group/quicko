import Link from "next/link";
import { listOpenDisputes } from "@/lib/queries/disputes";
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
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center text-sm text-muted">
          No open disputes. 🎉
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {items.map(({ dispute, route, raiser, agreedPrice }) => (
            <Link
              key={dispute.id}
              href={`/admin/matches/${dispute.matchId}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card active:scale-[0.99]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-error-soft text-xs font-bold text-error">
                {initials(raiser.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{route.fromCity} → {route.toCity}</span>
                  <span className="rounded-full bg-error-soft px-1.5 py-0.5 text-[10px] font-bold text-error">
                    {REASON_LABELS[dispute.reason] ?? dispute.reason}
                  </span>
                </div>
                <div className="truncate text-[13px] text-muted">
                  {inr(agreedPrice)} held · raised by {raiser.fullName ?? "—"}
                </div>
              </div>
              <span className="shrink-0 text-[12px] text-muted">{timeAgo(dispute.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
