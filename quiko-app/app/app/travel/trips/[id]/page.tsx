import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { RequestActions } from "@/components/RequestActions";
import { TravelerMatchFlow } from "@/components/TravelerMatchFlow";
import { KindChip, RouteTimeline } from "@/components/RouteCard";
import { CancelTripButton } from "@/components/CancelTripButton";
import { TRANSPORT_ICONS_SOLID, IconArrowRight, IconStar, IconPackage, IconChevronRight } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getOwnedTrip } from "@/lib/queries/trips";
import { getRequestsForTrip, spareCapacity } from "@/lib/queries/requests";
import { getMatchesForTrip, getCancelledMatchesForTrip } from "@/lib/queries/matches";
import { getOpenDisputeRaisers } from "@/lib/queries/disputes";
import { inr, dateShort, timeWindow, initials, timeAgo, placeShort } from "@/core/format";

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
  const Transport = TRANSPORT_ICONS_SOLID[trip.transport] ?? TRANSPORT_ICONS_SOLID.bus;

  return (
    <PhoneFrame>
      <TopBar title="Trip" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
        {/* Summary */}
        <div className="rounded-3xl border-2 border-ink bg-canvas p-5">
          <div className="mb-3 flex items-center gap-2">
            <KindChip icon={<Transport width={14} height={14} />} label="Trip" tone="trip" />
            <span className="ml-auto shrink-0">
              <StatusBadge status={trip.status} />
            </span>
          </div>
          {/* Departure and arrival hang off the route itself, so the card shows
              the journey rather than a table of rows. */}
          <RouteTimeline
            from={trip.fromCity}
            to={trip.toCity}
            size="lg"
            fromMeta={<When k="Departs" date={dateShort(trip.travelDate)} time={timeWindow(trip.departTime)} />}
            toMeta={
              <When
                k="Arrives"
                date={dateShort(trip.arriveDate ?? trip.travelDate)}
                time={timeWindow(trip.arriveTime)}
              />
            }
          />
          <Capacity spare={spareKg} total={trip.capacityKg} />
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
            <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
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
        <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
          Requests ({incoming.length})
        </h2>
        {incoming.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line-strong bg-surface p-6 text-center text-sm text-muted">
            No requests yet. Senders on your route will show up here.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {incoming.map(({ request, package: pkg, sender }) => (
              <div key={request.id} className="rounded-3xl bg-canvas p-4 shadow-card">
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
                  <span className="break-words font-semibold text-ink">{pkg.fromCity}</span>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <IconArrowRight width={13} height={13} className="shrink-0" />
                    <span className="break-words font-semibold text-ink">{pkg.toCity}</span>
                  </span>
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
            <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
              Your offers ({myOffers.length})
            </h2>
            <div className="flex flex-col gap-3">
              {myOffers.map(({ request, package: pkg, sender }) => (
                <div key={request.id} className="rounded-3xl bg-canvas p-4 shadow-card">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="truncate">{placeShort(pkg.fromCity)}</span>
                    <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
                    <span className="truncate">{placeShort(pkg.toCity)}</span>
                    <span className="ml-auto shrink-0 text-[15px] font-black">{inr(request.amount)}</span>
                  </div>
                  <div className="mt-2 rounded-xl bg-surface px-3 py-2 text-[13px] font-medium text-muted">
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
            <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
              Cancelled ({cancelled.length})
            </h2>
            <div className="flex flex-col gap-2">
              {cancelled.map((c) => (
                <div key={c.match.id} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3.5 shadow-card">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-[11px] font-bold text-muted">
                    {initials(c.sender.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold leading-snug">
                      <div className="truncate">{placeShort(c.package.fromCity)}</div>
                      <div className="truncate">
                        <span className="font-normal text-muted">&rarr;</span>{" "}
                        {placeShort(c.package.toCity)}
                      </div>
                    </div>
                    <div className="text-[12px] text-muted">
                      {c.sender.fullName ?? "Sender"} · {inr(c.match.agreedPrice)} · {timeAgo(c.match.updatedAt)}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold uppercase text-muted">Cancelled</span>
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

/** When the traveller leaves / lands. The date and time are what people scan
 *  for, so they sit in a solid chip rather than muted small print. */
function When({ k, date, time }: { k: string; date: string; time: string }) {
  return (
    <div className="mt-1.5 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-surface px-2.5 py-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{k}</span>
      <span className="text-[14px] font-bold text-ink">{date}</span>
      <span className="rounded-md bg-brand px-1.5 py-0.5 text-[13px] font-bold text-ink">
        {time}
      </span>
    </div>
  );
}

/** How full the trip is, as a gauge — easier to read at a glance than "0 kg free of 10 kg". */
function Capacity({ spare, total }: { spare: number; total: number }) {
  const used = Math.max(0, total - spare);
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="mt-4 rounded-2xl bg-surface p-3.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[12px] font-bold uppercase tracking-wide text-muted">Capacity</span>
        <span className="ml-auto text-[13px] font-bold">
          {spare} kg free
          <span className="font-semibold text-muted"> of {total} kg</span>
        </span>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={`${used} of ${total} kg booked`}
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
