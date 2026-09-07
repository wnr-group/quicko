import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { OfferButton } from "@/components/OfferButton";
import { IconArrowRight, IconStar, IconWeight, IconPackage } from "@/components/icons";
import { requireUser, getProfile } from "@/lib/auth";
import { getOwnedTrip } from "@/lib/queries/trips";
import { explorePackages } from "@/lib/queries/packages";
import { inr, dateShort, initials } from "@/core/format";
import { VERIFIED_LEVEL } from "@/lib/queries/kyc";

const SPEED_LABELS: Record<string, string> = {
  same_day: "Same day",
  next_day: "Next day",
  flexible: "Flexible",
};

export default async function TripPackagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const [trip, profile] = await Promise.all([getOwnedTrip(id, user.id), getProfile()]);
  if (!trip) notFound();
  // An unverified traveller may browse, but may not offer — the server rejects
  // it anyway (offerToCarryAction), so say so on the button instead.
  const verified = (profile?.kycLevel ?? 1) >= VERIFIED_LEVEL;

  const matches =
    trip.fromLat != null && trip.fromLng != null && trip.toLat != null && trip.toLng != null
      ? await explorePackages({
          tripId: trip.id,
          travelerId: trip.travelerId,
          fromLat: trip.fromLat,
          fromLng: trip.fromLng,
          toLat: trip.toLat,
          toLng: trip.toLng,
          tripDate: trip.travelDate,
          capacityKg: trip.capacityKg,
        })
      : [];

  return (
    <PhoneFrame>
      <TopBar title="Packages to carry" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
        <div className="mb-3 flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-[15px] font-bold shadow-card">
          <span className="truncate">{trip.fromCity}</span>
          <IconArrowRight width={15} height={15} className="shrink-0 text-muted" />
          <span className="truncate">{trip.toCity}</span>
        </div>

        {matches.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-line bg-white/60 p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-ink">
              <IconPackage width={22} height={22} />
            </span>
            <p className="mt-3 text-sm text-muted">
              No packages on your route in this window yet. Check back — new sends
              matching your trip will appear here.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
              {matches.length} package{matches.length > 1 ? "s" : ""} on your route
            </p>
            <div className="flex flex-col gap-3">
              {matches.map(({ package: pkg, sender }) => (
                <div key={pkg.id} className="rounded-3xl bg-white p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                      {initials(sender.fullName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">{sender.fullName ?? "Sender"}</div>
                      <div className="flex items-center gap-1 text-[13px] text-muted">
                        <IconStar width={12} height={12} className="text-brand-strong" />
                        {sender.ratingAvg > 0 ? sender.ratingAvg.toFixed(1) : "New"}
                        <span>· {sender.deliveriesCount} sent</span>
                      </div>
                    </div>
                    <span className="text-lg font-black">{inr(pkg.offerPrice)}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 font-semibold">
                    <span className="truncate">{pkg.fromCity}</span>
                    <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
                    <span className="truncate">{pkg.toCity}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[13px] text-muted">
                    <span className="flex items-center gap-1">
                      <IconWeight width={13} height={13} /> {pkg.weightKg}kg
                    </span>
                    <span>{SPEED_LABELS[pkg.timePreference] ?? pkg.timePreference}</span>
                    <span>{dateShort(pkg.travelDate)}</span>
                  </div>

                  <OfferButton tripId={trip.id} packageId={pkg.id} price={pkg.offerPrice} verified={verified} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PhoneFrame>
  );
}
