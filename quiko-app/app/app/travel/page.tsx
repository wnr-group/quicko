import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { NotificationBell } from "@/components/NotificationBell";
import { BottomNav } from "@/components/BottomNav";
import { StatusBadge } from "@/components/StatusBadge";
import { RouteCard } from "@/components/RouteCard";
import { IconPlus, IconArrowRight, IconPackage } from "@/components/icons";
import { TRANSPORT_ICONS_SOLID } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getMyTrips } from "@/lib/queries/trips";
import { getTravelerMatches, getTravelerWallet, countActiveMatches } from "@/lib/queries/matches";
import { dateShort, timeWindow, inr, placeShort } from "@/core/format";

export default async function TravelHome() {
  const user = await requireUser();
  const [trips, carrying, wallet, matchCount] = await Promise.all([
    getMyTrips(user.id),
    getTravelerMatches(user.id),
    getTravelerWallet(user.id),
    countActiveMatches(user.id),
  ]);
  const active = carrying.filter(
    (c) => c.match.status !== "completed" && c.match.status !== "cancelled",
  );

  return (
    <PhoneFrame>
      <header className="pt-safe flex items-start justify-between px-5 pb-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Travel &amp; Earn</h1>
          <p className="text-sm text-muted">Post trips and carry packages on your way.</p>
        </div>
        <NotificationBell profileId={user.id} />
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        {/* Earnings summary → wallet */}
        <Link href="/app/wallet"
          className="mt-2 flex items-center gap-3 rounded-3xl bg-canvas p-4 shadow-card transition-transform active:scale-[0.99]">
          <div className="flex-1">
            <div className="text-[12px] font-bold uppercase tracking-wide text-muted">Total earned</div>
            <div className="text-2xl font-black tracking-tight text-ink">{inr(wallet.earned)}</div>
            {wallet.pending > 0 && (
              <div className="text-[12px] text-muted">{inr(wallet.pending)} in escrow</div>
            )}
          </div>
          <span className="flex items-center gap-0.5 text-[13px] font-semibold text-ink">
            Wallet <IconArrowRight width={15} height={15} />
          </span>
        </Link>

        <Link href="/app/travel/new"
          className="mt-3 flex items-center gap-4 rounded-3xl bg-brand p-4 shadow-card active:scale-[0.98]">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-brand">
            <IconPlus width={22} height={22} />
          </span>
          <div>
            <div className="text-[16px] font-bold">Post a trip</div>
            <div className="text-[13px] text-ink-soft">Tell us where you&rsquo;re headed &amp; earn</div>
          </div>
        </Link>

        {active.length > 0 && (
          <>
            <h2 className="mb-2 mt-8 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
              Carrying now
            </h2>
            <ul className="flex flex-col gap-2.5">
              {active.map((c) => (
                <li key={c.match.id}>
                  <RouteCard
                    href={`/app/travel/trips/${c.match.tripId}`}
                    from={placeShort(c.package.fromCity)}
                    to={placeShort(c.package.toCity)}
                    kind={{ icon: <IconPackage width={13} height={13} strokeWidth={2.25} />, label: "Package" }}
                    amount={<span className="text-success">{inr(c.match.agreedPrice)}</span>}
                    meta={
                      <>
                        <span className="rounded-md bg-brand px-1.5 py-0.5 text-[12px] font-bold text-ink">
                          {c.package.weightKg}kg
                        </span>
                        {` · from ${c.sender.fullName}`}
                      </>
                    }
                    badge={<StatusBadge status={c.match.status} />}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mb-2 mt-8 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
          Your trips
        </h2>
        {trips.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line-strong bg-surface p-6 text-center text-sm text-muted">
            No trips yet. Post one to start carrying packages.
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {trips.map((t) => {
              const Transport = TRANSPORT_ICONS_SOLID[t.transport] ?? TRANSPORT_ICONS_SOLID.bus;
              return (
                <li key={t.id}>
                  <RouteCard
                    href={`/app/travel/trips/${t.id}`}
                    from={placeShort(t.fromCity)}
                    to={placeShort(t.toCity)}
                    kind={{ icon: <Transport width={14} height={14} />, label: "Trip", tone: "trip" }}
                    amount={
                      <span className="rounded-lg bg-brand px-2 py-1 text-[13px] font-bold text-ink">
                        {t.spareKg}kg free
                      </span>
                    }
                    meta={
                      <span className="font-bold text-ink">
                        {dateShort(t.travelDate)} · {timeWindow(t.departTime)}
                        <span className="font-semibold text-muted"> · of {t.capacityKg}kg</span>
                      </span>
                    }
                    badge={<StatusBadge status={t.status} />}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav matchCount={matchCount} />
    </PhoneFrame>
  );
}
