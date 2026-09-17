import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { RequestActions } from "@/components/RequestActions";
import { TravelerMatchFlow } from "@/components/TravelerMatchFlow";
import { CancelTripButton } from "@/components/CancelTripButton";
import { TRANSPORT_ICONS, IconArrowRight, IconStar, IconPackage, IconChevronRight } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getOwnedTrip } from "@/lib/queries/trips";
import { getRequestsForTrip, spareCapacity } from "@/lib/queries/requests";
import { getMatchesForTrip, getCancelledMatchesForTrip } from "@/lib/queries/matches";
import { getOpenDisputeRaisers } from "@/lib/queries/disputes";
import { inr, dateShort, timeWindow, initials, timeAgo } from "@/core/format";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const trip = await getOwnedTrip(id, user.id);
  if (!trip) notFound();

  const [requests, carrying, cancelled] = await Promise.all([
    getRequestsForTrip(id),
    getMatchesForTrip(id),
    getCancelledMatchesForTrip(id),
  ]);
  const disputeRaisers = await getOpenDisputeRaisers(carrying.map((c) => c.match.id));
  const spareKg = await spareCapacity(trip.id, trip.capacityKg);
  const pending = requests.filter((r) => r.request.status === "pending");
  // Requests the sender initiated → the traveler accepts/declines these.
  const incoming = pending.filter((r) => r.request.initiatorRole === "sender");
  // Offers the traveler made → waiting on the sender.
  const myOffers = pending.filter((r) => r.request.initiatorRole === "traveler");
  const Transport = TRANSPORT_ICONS[trip.transport] ?? TRANSPORT_ICONS.flight;

  return (
    <PhoneFrame>
      <TopBar title="Trip" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
        {/* Summary */}
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-ink">
              <Transport width={20} height={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <span className="truncate">{trip.fromCity}</span>
                <IconArrowRight width={16} height={16} className="shrink-0 text-muted" />
                <span className="truncate">{trip.toCity}</span>
              </div>
              <div className="text-[13px] text-muted">
                {trip.arriveDate && trip.arriveDate !== trip.travelDate
                  ? `${dateShort(trip.travelDate)} → ${dateShort(trip.arriveDate)}`
                  : dateShort(trip.travelDate)}
              </div>
            </div>
            <StatusBadge status={trip.status} />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
            <Detail k="Departs" v={timeWindow(trip.departTime)} sub={dateShort(trip.travelDate)} />
            <Detail k="Arrives" v={timeWindow(trip.arriveTime)} sub={dateShort(trip.arriveDate ?? trip.travelDate)} />
            <Detail k="Capacity" v={`${spareKg} kg free`} sub={`of ${trip.capacityKg} kg`} />
          </dl>
        </div>

        {/* Find packages to carry */}
        {trip.status === "active" && (
          <Link
            href={`/app/travel/trips/${trip.id}/packages`}
            className="mt-3 flex items-center gap-3 rounded-2xl bg-brand p-3.5 shadow-card active:scale-[0.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-brand">
              <IconPackage width={19} height={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-bold">Find packages to carry</div>
              <div className="text-[13px] text-ink-soft">Browse sends on your route &amp; offer</div>
            </div>
            <IconChevronRight width={18} height={18} className="shrink-0 text-ink" />
          </Link>
        )}

        {/* Carrying */}
        {carrying.length > 0 && (
          <>
            <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
              Carrying ({carrying.length})
            </h2>
            <div className="flex flex-col gap-3">
              {carrying.map((c) => (
                <TravelerMatchFlow
                  key={c.match.id}
                  matchId={c.match.id}
                  tripId={trip.id}
                  packageId={c.package.id}
                  status={c.match.status}
                  price={c.match.agreedPrice}
                  fromCity={c.package.fromCity}
                  toCity={c.package.toCity}
                  weight={c.package.weightKg}
                  senderName={c.sender.fullName ?? "Sender"}
                  receiverName={c.package.receiverName}
                  receiverPhone={c.package.receiverPhone}
                  disputeRaisedByMe={disputeRaisers[c.match.id] === user.id}
                />
              ))}
            </div>
          </>
        )}

        {/* Incoming requests (sender asked this traveler) */}
        <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
          Requests ({incoming.length})
        </h2>
        {incoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center text-sm text-muted">
            No requests yet. Senders on your route will show up here.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {incoming.map(({ request, package: pkg, sender }) => (
              <div key={request.id} className="rounded-3xl bg-white p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                    {initials(sender.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{sender.fullName ?? "Sender"}</div>
                    <div className="flex items-center gap-1 text-[13px] text-muted">
                      <IconStar width={12} height={12} className="text-brand-strong" />
                      {sender.ratingAvg > 0 ? sender.ratingAvg.toFixed(1) : "New"}
                    </div>
                  </div>
                  <span className="text-lg font-black">{inr(request.amount)}</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[13px] text-muted">
                  <span className="truncate font-semibold text-ink">{pkg.fromCity}</span>
                  <IconArrowRight width={13} height={13} className="shrink-0" />
                  <span className="truncate font-semibold text-ink">{pkg.toCity}</span>
                  <span className="ml-auto shrink-0">{pkg.weightKg}kg</span>
                </div>
                <RequestActions requestId={request.id} tripId={trip.id} />
              </div>
            ))}
          </div>
        )}

        {/* Offers this traveler made — waiting on the sender */}
        {myOffers.length > 0 && (
          <>
            <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
              Your offers ({myOffers.length})
            </h2>
            <div className="flex flex-col gap-3">
              {myOffers.map(({ request, package: pkg, sender }) => (
                <div key={request.id} className="rounded-3xl bg-white p-4 shadow-card">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="truncate">{pkg.fromCity}</span>
                    <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
                    <span className="truncate">{pkg.toCity}</span>
                    <span className="ml-auto shrink-0 text-[15px] font-black">{inr(request.amount)}</span>
                  </div>
                  <div className="mt-2 rounded-xl bg-neutral-100 px-3 py-2 text-[13px] font-medium text-muted">
                    Offer sent to {sender.fullName ?? "the sender"} — waiting for them to accept.
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Cancelled history — a record of matches that fell through */}
        {cancelled.length > 0 && (
          <>
            <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
              Cancelled ({cancelled.length})
            </h2>
            <div className="flex flex-col gap-2">
              {cancelled.map((c) => (
                <div key={c.match.id} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3.5 shadow-card">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-[11px] font-bold text-muted">
                    {initials(c.sender.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[13px] font-semibold">
                      <span className="truncate">{c.package.fromCity}</span>
                      <IconArrowRight width={12} height={12} className="shrink-0 text-muted" />
                      <span className="truncate">{c.package.toCity}</span>
                    </div>
                    <div className="text-[12px] text-muted">
                      {c.sender.fullName ?? "Sender"} · {inr(c.match.agreedPrice)} · {timeAgo(c.match.updatedAt)}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold uppercase text-muted">Cancelled</span>
                </div>
              ))}
            </div>
          </>
        )}

        {trip.status === "active" && carrying.length === 0 && (
          <div className="mt-6">
            <CancelTripButton tripId={trip.id} />
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

function Detail({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{k}</dt>
      <dd className="mt-0.5 text-[14px] font-bold">{v}</dd>
      {sub && <dd className="text-[11px] text-muted">{sub}</dd>}
    </div>
  );
}
