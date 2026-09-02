import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { IconArrowRight, IconClock, IconCheck } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getTravelerWallet } from "@/lib/queries/matches";
import { inr, timeAgo } from "@/core/format";

const UPCOMING_LABEL: Record<string, string> = {
  paid: "Awaiting pickup",
  picked_up: "Picked up",
  in_transit: "In transit",
};

export default async function WalletPage() {
  const user = await requireUser();
  const wallet = await getTravelerWallet(user.id);

  return (
    <PhoneFrame>
      <TopBar title="Earnings" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
        {/* Balance hero */}
        <div className="rounded-3xl bg-ink p-5 text-white shadow-card">
          <p className="text-[13px] font-medium text-white/60">Total earned</p>
          <p className="mt-1 text-4xl font-black tracking-tight text-brand">{inr(wallet.earned)}</p>
          <p className="mt-1 text-[13px] text-white/60">
            across {wallet.deliveries} deliver{wallet.deliveries === 1 ? "y" : "ies"} · after 2% fee
          </p>
        </div>

        {/* In-escrow */}
        {wallet.pending > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-ink">
              <IconClock width={19} height={19} />
            </span>
            <div className="flex-1">
              <div className="text-[15px] font-bold">{inr(wallet.pending)} in escrow</div>
              <div className="text-[13px] text-muted">Releases as you complete deliveries</div>
            </div>
          </div>
        )}

        {/* Upcoming (carrying now) */}
        {wallet.upcoming.length > 0 && (
          <>
            <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
              In progress
            </h2>
            <ul className="flex flex-col gap-2.5">
              {wallet.upcoming.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/app/travel/trips/${u.tripId}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card active:scale-[0.99]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-ink text-sm font-bold">
                      {inr(u.amount)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="truncate">{u.fromCity}</span>
                        <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
                        <span className="truncate">{u.toCity}</span>
                      </div>
                      <div className="text-[13px] text-muted">{UPCOMING_LABEL[u.status] ?? u.status}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Payout history */}
        <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
          Payouts
        </h2>
        {wallet.payouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center text-sm text-muted">
            No payouts yet. Complete a delivery to start earning.
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {wallet.payouts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                  <IconCheck width={18} height={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="truncate">{p.fromCity}</span>
                    <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
                    <span className="truncate">{p.toCity}</span>
                  </div>
                  <div className="text-[13px] text-muted">{timeAgo(p.createdAt)}</div>
                </div>
                <span className="shrink-0 text-[15px] font-black text-success">+{inr(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PhoneFrame>
  );
}
