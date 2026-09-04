import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { DeletePackageButton } from "@/components/DeletePackageButton";
import { SenderRequestActions } from "@/components/SenderRequestActions";
import { MatchFlow } from "@/components/MatchFlow";
import {
  IconArrowRight,
  IconChevronRight,
  IconPackage,
  IconPlane,
  IconEdit,
  TRANSPORT_ICONS,
} from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getOwnedPackage } from "@/lib/queries/packages";
import { getRequestsForPackage, getMatchForPackage, getCancelledMatchesForPackage } from "@/lib/queries/requests";
import { getOpenDisputeRaisers } from "@/lib/queries/disputes";
import { inr, initials, dateShort, timeWindow, timeAgo } from "@/core/format";

const SPEED_LABELS: Record<string, string> = {
  same_day: "Same day",
  next_day: "Next day",
  flexible: "Flexible",
};

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const pkg = await getOwnedPackage(id, user.id);
  if (!pkg) notFound();

  const [requests, match, cancelled] = await Promise.all([
    getRequestsForPackage(pkg.id),
    getMatchForPackage(pkg.id),
    getCancelledMatchesForPackage(pkg.id),
  ]);
  const disputeRaisers = match ? await getOpenDisputeRaisers([match.match.id]) : {};
  const disputeRaisedByMe = !!match && disputeRaisers[match.match.id] === user.id;
  // Pending offers a traveler made → the sender accepts/declines. Everything
  // else (requests the sender sent, or already-handled ones) is read-only.
  const offers = requests.filter(
    (r) => r.request.status === "pending" && r.request.initiatorRole === "traveler",
  );
  const sent = requests.filter(
    (r) => !(r.request.status === "pending" && r.request.initiatorRole === "traveler"),
  );
  const dateLabel =
    pkg.dateTo && pkg.dateTo !== pkg.travelDate
      ? `${pkg.travelDate} → ${pkg.dateTo}`
      : pkg.travelDate;

  return (
    <PhoneFrame>
      <TopBar title="Package" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
        {/* Summary */}
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-ink">
              <IconPackage width={20} height={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <span className="truncate">{pkg.fromCity}</span>
                <IconArrowRight width={16} height={16} className="shrink-0 text-muted" />
                <span className="truncate">{pkg.toCity}</span>
              </div>
              <div className="text-[13px] text-muted">{dateLabel}</div>
            </div>
            <StatusBadge status={pkg.status} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-center">
            <Detail k="Weight" v={`${pkg.weightKg} kg`} />
            <Detail k="Speed" v={SPEED_LABELS[pkg.timePreference] ?? pkg.timePreference} />
          </dl>
        </div>

        {/* Contents + receiver (once provided) */}
        {(pkg.description || pkg.receiverName) && (
          <div className="mt-3 rounded-3xl bg-white p-5 shadow-card">
            {pkg.description && (
              <div className={pkg.receiverName ? "mb-3" : ""}>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Contents</dt>
                <dd className="mt-0.5 text-[14px]">{pkg.description}</dd>
              </div>
            )}
            {pkg.receiverName && (
              <>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Receiver</dt>
                <dd className="mt-0.5 text-[14px] font-semibold">
                  {pkg.receiverName}
                  {pkg.receiverPhone && (
                    <span className="font-normal text-muted"> · {pkg.receiverPhone}</span>
                  )}
                </dd>
              </>
            )}
          </div>
        )}

        {/* Edit / cancel — only while the package is still active */}
        {pkg.status === "active" && (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Link
              href={`/app/packages/${pkg.id}/edit`}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-3.5 text-[15px] font-semibold text-ink active:scale-[0.98]"
            >
              <IconEdit width={16} height={16} /> Edit
            </Link>
            <DeletePackageButton packageId={pkg.id} />
          </div>
        )}

        {match ? (
          <MatchFlow
            packageId={pkg.id}
            matchId={match.match.id}
            status={match.match.status}
            price={match.match.agreedPrice}
            otp={match.match.deliveryOtp ?? ""}
            travelerName={match.traveler.fullName ?? "Traveler"}
            travelerId={match.traveler.id}
            hasReceiver={!!(pkg.receiverName && pkg.receiverPhone)}
            route={`${pkg.fromCity} → ${pkg.toCity}`}
            detourKm={match.match.detourKm}
            detourFee={match.match.detourFee}
            detourOptedOut={match.match.detourOptedOut}
            detourSelfCollect={match.match.detourSelfCollect}
            pickupPhotoUrl={match.match.pickupPhotoUrl}
            deliveryPhotoUrl={match.match.deliveryPhotoUrl}
            disputeRaisedByMe={disputeRaisedByMe}
          />
        ) : (
          <>
            {/* Find travellers — the main action on an unmatched package.
                Mirrors the traveller side's "Find packages to carry" banner. */}
            {pkg.status === "active" && (
              <Link
                href={`/app/packages/${pkg.id}/travelers`}
                className="mt-3 flex items-center gap-3 rounded-2xl bg-brand p-3.5 shadow-card active:scale-[0.99]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-brand">
                  <IconPlane width={19} height={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">Find travellers</div>
                  <div className="text-[13px] text-ink-soft">Browse travellers on your route &amp; request</div>
                </div>
                <IconChevronRight width={18} height={18} className="shrink-0 text-ink" />
              </Link>
            )}

            {/* Offers from travelers — the sender accepts/declines these */}
            {offers.length > 0 && (
              <>
                <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
                  Offers to carry ({offers.length})
                </h2>
                <div className="flex flex-col gap-3">
                  {offers.map(({ request, trip, traveler }) => {
                    const Transport = trip
                      ? TRANSPORT_ICONS[trip.transport] ?? IconPackage
                      : IconPackage;
                    return (
                      <div key={request.id} className="rounded-3xl bg-white p-4 shadow-card">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                            {initials(traveler?.fullName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold">{traveler?.fullName ?? "Traveler"}</div>
                            <div className="text-[13px] text-muted">offers to carry your package</div>
                          </div>
                          <span className="text-lg font-black">{inr(request.amount)}</span>
                        </div>
                        {trip && (
                          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[13px] text-muted">
                            <Transport width={15} height={15} className="shrink-0" />
                            <span>{dateShort(trip.travelDate)}</span>
                            <span className="ml-auto">
                              {timeWindow(trip.departTime)} → {timeWindow(trip.arriveTime)}
                            </span>
                          </div>
                        )}
                        <SenderRequestActions requestId={request.id} packageId={pkg.id} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <h2 className="mb-2 mt-7 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
              Requests ({sent.length})
            </h2>

            {sent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center text-sm text-muted">
                No requests yet. Browse travelers and send one.
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {sent.map(({ request, traveler }) => (
                  <li
                    key={request.id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                      {initials(traveler?.fullName)}
                    </span>
                    <div className="flex-1">
                      <div className="text-[15px] font-bold">
                        {traveler?.fullName ?? "Traveler"}
                      </div>
                      <div className="text-[13px] text-muted">{inr(request.amount)}</div>
                    </div>
                    <StatusBadge status={request.status} />
                  </li>
                ))}
              </ul>
            )}
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
                    {initials(c.traveler.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">{c.traveler.fullName ?? "Traveller"}</div>
                    <div className="text-[12px] text-muted">{inr(c.match.agreedPrice)} · {timeAgo(c.match.updatedAt)}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold uppercase text-muted">Cancelled</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PhoneFrame>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{k}</dt>
      <dd className="mt-0.5 text-[14px] font-bold">{v}</dd>
    </div>
  );
}
