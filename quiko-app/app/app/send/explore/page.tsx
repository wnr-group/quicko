import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { ExploreTravelerCard } from "@/components/ExploreTravelerCard";
import { ExploreFilters } from "@/components/ExploreFilters";
import { ReachFilter } from "@/components/ReachFilter";
import { IconArrowRight } from "@/components/icons";
import { exploreTrips } from "@/lib/queries/trips";
import { parseSendParams, toSendQuery } from "@/lib/sendParams";

// Public — browse travelers without logging in.
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsed = parseSendParams(sp);
  if (!parsed) redirect("/app/send");

  // Effective arrival window = the reach filter (r1/r2), else the step-1 window.
  const r1 = typeof sp.r1 === "string" ? sp.r1 : parsed.dateFrom;
  const r2 = typeof sp.r2 === "string" ? sp.r2 : parsed.dateTo;
  const effective = { ...parsed, dateFrom: r1, dateTo: r2 };

  const all = await exploreTrips({
    fromLat: parsed.from.lat, fromLng: parsed.from.lng,
    toLat: parsed.to.lat, toLng: parsed.to.lng,
    dateFrom: r1, dateTo: r2,
  });

  // Filters + sort (client-driven via URL params; applied here in-memory).
  const sort = typeof sp.sort === "string" ? sp.sort : "arrival";
  const transport = typeof sp.transport === "string" ? sp.transport : "";

  const trips = all
    .filter(({ trip }) => (transport ? trip.transport === transport : true))
    .sort((a, b) => {
      if (sort === "rating") return b.traveler.ratingAvg - a.traveler.ratingAvg;
      if (sort === "trust") return b.traveler.trustScore - a.traveler.trustScore;
      if (sort === "departure")
        return a.trip.travelDate.localeCompare(b.trip.travelDate) || (a.trip.departTime ?? "").localeCompare(b.trip.departTime ?? "");
      // arrival (default)
      return a.trip.travelDate.localeCompare(b.trip.travelDate) || (a.trip.arriveTime ?? "").localeCompare(b.trip.arriveTime ?? "");
    });

  const SORT_LABELS: Record<string, string> = {
    arrival: "earliest arrival first", departure: "earliest departure first", rating: "highest rated first", trust: "most trusted first",
  };

  const query = toSendQuery(effective);
  const detailsHref = (extra: string) => `/app/send/details?${query}&${extra}`;

  return (
    <PhoneFrame>
      <TopBar title="Explore travellers" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28">
        <div className="mb-3 flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-[15px] font-bold shadow-card">
          <span className="truncate">{parsed.from.label}</span>
          <IconArrowRight width={15} height={15} className="shrink-0 text-muted" />
          <span className="truncate">{parsed.to.label}</span>
        </div>

        <Suspense fallback={null}>
          <ReachFilter min={parsed.dateFrom} />
        </Suspense>

        {all.length > 0 && (
          <Suspense fallback={null}>
            <ExploreFilters sort={sort} transport={transport} />
          </Suspense>
        )}

        {trips.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-line bg-white/60 p-8 text-center">
            <p className="text-sm text-muted">
              {all.length === 0
                ? "No travelers on this route in that window yet — leave it below and we’ll notify you when one shows up."
                : "No travellers match these filters — try widening them."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
              {trips.length} traveler{trips.length > 1 ? "s" : ""} · {SORT_LABELS[sort] ?? SORT_LABELS.arrival}
            </p>
            <div className="flex flex-col gap-3">
              {trips.map(({ trip, traveler }) => (
                <ExploreTravelerCard
                  key={trip.id}
                  href={detailsHref(`tripId=${trip.id}`)}
                  profileHref={`/app/travelers/${traveler.id}`}
                  name={traveler.fullName ?? "Traveler"}
                  kycLevel={traveler.kycLevel}
                  transport={trip.transport}
                  travelDate={trip.travelDate}
                  arriveDate={trip.arriveDate}
                  departTime={trip.departTime}
                  arriveTime={trip.arriveTime}
                  rating={traveler.ratingAvg}
                  deliveries={traveler.deliveriesCount}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating "notify me" */}
      <div className="pb-safe pointer-events-none absolute inset-x-0 bottom-0 px-5 pt-8">
        <Link href={detailsHref("notify=1")}
          className="pointer-events-auto flex w-full flex-col items-center rounded-2xl bg-ink px-5 py-3 text-center text-white shadow-pop active:scale-[0.98]">
          <span className="text-[15px] font-semibold">Can&rsquo;t find a match?</span>
          <span className="text-[12px] text-white/70">Leave it here &amp; we&rsquo;ll notify you when one appears</span>
        </Link>
      </div>
    </PhoneFrame>
  );
}
