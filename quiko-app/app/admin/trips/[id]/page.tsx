import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminTrip } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { Panel, KV } from "@/components/adminkit";
import { inr, formatPhone, dateShort, timeWindow, timeAgo } from "@/core/format";

export default async function AdminTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminTrip(id);
  if (!data) notFound();
  const { trip, traveler, matches } = data;

  return (
    <>
      <Link href="/admin/search" className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; Search
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">
          {trip.fromCity} &rarr; {trip.toCity}
        </h1>
        <StatusBadge status={trip.status} />
      </div>
      <p className="text-[12px] text-muted">Trip {trip.id}</p>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel title="Trip" accent>
            <KV
              k="Traveller"
              v={traveler?.fullName ? `${traveler.fullName} · ${formatPhone(traveler.phone)}` : "—"}
              link={traveler ? `/admin/users/${traveler.id}` : undefined}
            />
            <KV k="Departs" v={`${dateShort(trip.travelDate)} · ${timeWindow(trip.departTime)}`} />
            <KV
              k="Arrives"
              v={`${dateShort(trip.arriveDate ?? trip.travelDate)} · ${timeWindow(trip.arriveTime)}`}
            />
            <KV k="Transport" v={trip.transport} />
            <KV k="Capacity" v={`${trip.capacityKg} kg`} />
            <KV
              k="Extra detour"
              v={trip.extraDetourKm > 0 ? `up to +${trip.extraDetourKm} km` : "none"}
            />
            <KV k="Created" v={timeAgo(trip.createdAt)} />
          </Panel>
        </div>

        <div>
          <Panel title={`Matches (${matches.length})`}>
            {matches.length === 0 ? (
              <p className="py-2 text-[13px] text-muted">None.</p>
            ) : (
              <div className="flex flex-col">
                {matches.map((m) => (
                  <Link
                    key={m.id}
                    href={`/admin/matches/${m.id}`}
                    className="flex items-center gap-3 border-b border-line py-2.5 transition-colors last:border-0 hover:bg-brand-soft"
                  >
                    <span className="flex-1 font-semibold tabular-nums">{inr(m.agreedPrice)}</span>
                    <StatusBadge status={m.status} />
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
