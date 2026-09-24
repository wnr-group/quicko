import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { RouteCard } from "@/components/RouteCard";
import { IconClock, IconCheck, IconPackage } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getTravelerWallet } from "@/lib/queries/matches";
import { inr, timeAgo, placeShort } from "@/core/format";

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
        <div className="rounded-3xl bg-brand p-5 shadow-brand">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft">Total earned</p>
          <p className="mt-1 text-4xl font-black tracking-tight text-ink">{inr(wallet.earned)}</p>
          <p className="mt-1 text-[13px] text-ink-soft">
            across {wallet.deliveries} deliver{wallet.deliveries === 1 ? "y" : "ies"} · after 10% fee
          </p>
        </div>

        {/* In-escrow */}
        {wallet.pending > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-canvas p-4 shadow-card">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-ink">
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
            <h2 className="mb-3 mt-7 flex items-center gap-2 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
              In progress
              <span className="h-px flex-1 bg-line" />
            </h2>
            <ul className="flex flex-col gap-2.5">
              {wallet.upcoming.map((u) => (
                <li key={u.id}>
                  <RouteCard
                    href={`/app/travel/trips/${u.tripId}`}
                    from={placeShort(u.fromCity)}
                    to={placeShort(u.toCity)}
                    kind={{ icon: <IconPackage width={13} height={13} strokeWidth={2.25} />, label: "Package" }}
                    amount={inr(u.amount)}
                    meta={UPCOMING_LABEL[u.status] ?? u.status}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Payout history */}
        <h2 className="mb-3 mt-7 flex items-center gap-2 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
          Payouts
          <span className="h-px flex-1 bg-line" />
        </h2>
        {wallet.payouts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line-strong bg-surface p-6 text-center text-sm text-muted">
            No payouts yet. Complete a delivery to start earning.
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {wallet.payouts.map((p) => (
              <li key={p.id}>
                <RouteCard
                  from={placeShort(p.fromCity)}
                  to={placeShort(p.toCity)}
                  kind={{ icon: <IconCheck width={13} height={13} strokeWidth={2.25} />, label: "Payout" }}
                  amount={<span className="text-success">+{inr(p.amount)}</span>}
                  meta={
                    <span className="inline-flex items-center gap-1.5">
                      <IconCheck width={14} height={14} className="text-success" />
                      {timeAgo(p.createdAt)}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PhoneFrame>
  );
}
