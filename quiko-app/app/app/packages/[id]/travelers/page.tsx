import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { TravelerCard } from "@/components/TravelerCard";
import { SortTabs } from "@/components/SortTabs";
import { TravelerFilters } from "@/components/TravelerFilters";
import { IconArrowRight } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getOwnedPackage } from "@/lib/queries/packages";
import { findMatchingTrips } from "@/lib/queries/trips";
import { getRequestedTripIds } from "@/lib/queries/requests";
import { inr } from "@/core/format";

const SORTS: Record<string, (a: { traveler: T }, b: { traveler: T }) => number> = {
  trust: (a, b) => b.traveler.trustScore - a.traveler.trustScore,
  rating: (a, b) => b.traveler.ratingAvg - a.traveler.ratingAvg,
  deliveries: (a, b) => b.traveler.deliveriesCount - a.traveler.deliveriesCount,
};
type T = { trustScore: number; ratingAvg: number; deliveriesCount: number };

export default async function TravelersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; transport?: string }>;
}) {
  const { id } = await params;
  const { sort, transport = "" } = await searchParams;
  const user = await requireUser();
  const pkg = await getOwnedPackage(id, user.id);
  if (!pkg) notFound();

  const [found, requestedTripIds] = await Promise.all([
    findMatchingTrips(pkg),
    getRequestedTripIds(pkg.id),
  ]);
  const trips = [...found]
    .filter(({ trip }) => (transport ? trip.transport === transport : true))
    .sort(SORTS[sort ?? "trust"] ?? SORTS.trust);

  return (
    <PhoneFrame>
      <TopBar title="Travelers" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        {/* Package summary chip */}
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-card">
          <div className="flex items-center gap-1.5 text-[15px] font-bold">
            <span>{pkg.fromCity}</span>
            <IconArrowRight width={15} height={15} className="text-muted" />
            <span>{pkg.toCity}</span>
          </div>
          <div className="text-[13px] text-muted">
            {pkg.weightKg}kg · offering{" "}
            <span className="font-bold text-ink">{inr(pkg.offerPrice)}</span>
          </div>
        </div>

        {found.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-line bg-white/60 p-8 text-center">
            <p className="text-sm text-muted">
              No travelers on this route yet. We&rsquo;ll notify you when one posts
              a matching trip.
            </p>
          </div>
        ) : (
          <>
            <Suspense fallback={null}>
              <SortTabs />
            </Suspense>
            <TravelerFilters transport={transport} />

            {trips.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-dashed border-line bg-white/60 p-8 text-center">
                <p className="text-sm text-muted">No travellers match these filters — try widening them.</p>
              </div>
            ) : (
              <>
                <p className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
                  {trips.length} traveler{trips.length > 1 ? "s" : ""} on your route
                </p>
                <div className="flex flex-col gap-3">
                  {trips.map(({ trip, traveler }) => (
                    <TravelerCard
                      key={trip.id}
                      packageId={pkg.id}
                      tripId={trip.id}
                      amount={pkg.offerPrice}
                      name={traveler.fullName ?? "Traveler"}
                      rating={traveler.ratingAvg}
                      deliveries={traveler.deliveriesCount}
                      kycLevel={traveler.kycLevel}
                      transport={trip.transport}
                      capacityKg={trip.capacityKg}
                      pickupArea={trip.pickupArea ?? ""}
                      deliveryArea={trip.deliveryArea ?? ""}
                      alreadyRequested={requestedTripIds.has(trip.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <Link
          href={`/app/packages/${pkg.id}`}
          className="mt-6 block text-center text-sm font-semibold text-muted underline"
        >
          View request status
        </Link>
      </div>
    </PhoneFrame>
  );
}
