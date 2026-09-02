import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { NotificationBell } from "@/components/NotificationBell";
import { BottomNav } from "@/components/BottomNav";
import { StatusBadge } from "@/components/StatusBadge";
import { IconPlus, IconArrowRight, IconPlane } from "@/components/icons";
import { TRANSPORT_ICONS } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getMyTrips } from "@/lib/queries/trips";
import { getTravelerMatches, getTravelerWallet, countActiveMatches } from "@/lib/queries/matches";
import { dateShort, timeWindow, inr } from "@/core/format";

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
          className="mt-2 flex items-center gap-3 rounded-3xl bg-ink p-4 text-white shadow-card active:scale-[0.99]">
          <div className="flex-1">
            <div className="text-[12px] font-medium text-white/60">Total earned</div>
            <div className="text-2xl font-black tracking-tight text-brand">{inr(wallet.earned)}</div>
            {wallet.pending > 0 && (
              <div className="text-[12px] text-white/60">{inr(wallet.pending)} in escrow</div>
            )}
          </div>
          <span className="flex items-center gap-0.5 text-[13px] font-semibold text-brand">
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
            <h2 className="mb-2 mt-8 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
              Carrying now
            </h2>
            <ul className="flex flex-col gap-2.5">
              {active.map((c) => (
                <li key={c.match.id}>
                  <Link href={`/app/travel/trips/${c.match.tripId}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card active:scale-[0.99]">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success text-sm font-bold">
                      {inr(c.match.agreedPrice)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="truncate">{c.package.fromCity}</span>
                        <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
                        <span className="truncate">{c.package.toCity}</span>
                      </div>
                      <div className="text-[13px] text-muted">{c.package.weightKg}kg · from {c.sender.fullName}</div>
                    </div>
                    <StatusBadge status={c.match.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mb-2 mt-8 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
          Your trips
        </h2>
        {trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center text-sm text-muted">
            No trips yet. Post one to start carrying packages.
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {trips.map((t) => {
              const Transport = TRANSPORT_ICONS[t.transport] ?? IconPlane;
              return (
                <li key={t.id}>
                  <Link href={`/app/travel/trips/${t.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card active:scale-[0.99]">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-ink">
                      <Transport width={19} height={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="truncate">{t.fromCity}</span>
                        <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
                        <span className="truncate">{t.toCity}</span>
                      </div>
                      <div className="text-[13px] text-muted">
                        {dateShort(t.travelDate)} · {timeWindow(t.departTime)} · {t.capacityKg}kg free
                      </div>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
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
