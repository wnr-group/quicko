import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminTrip } from "@/lib/queries/admin";
import { inr, formatPhone, dateShort, timeWindow, timeAgo } from "@/core/format";

export default async function AdminTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminTrip(id);
  if (!data) notFound();
  const { trip, traveler, matches } = data;

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">{trip.fromCity} → {trip.toCity}</h1>
      <p className="text-[12px] text-muted">Trip {trip.id}</p>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow-card">
        <KV k="Status" v={trip.status} />
        <KV k="Traveller" v={traveler?.fullName ? `${traveler.fullName} · ${formatPhone(traveler.phone)}` : "—"} link={traveler ? `/admin/users/${traveler.id}` : undefined} />
        <KV k="Departs" v={`${dateShort(trip.travelDate)} · ${timeWindow(trip.departTime)}`} />
        <KV k="Arrives" v={`${dateShort(trip.arriveDate ?? trip.travelDate)} · ${timeWindow(trip.arriveTime)}`} />
        <KV k="Transport" v={trip.transport} />
        <KV k="Capacity" v={`${trip.capacityKg} kg`} />
        <KV k="Extra detour" v={trip.extraDetourKm > 0 ? `up to +${trip.extraDetourKm} km` : "none"} />
        <KV k="Created" v={timeAgo(trip.createdAt)} />
      </div>

      <h2 className="mt-5 mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">Matches ({matches.length})</h2>
      {matches.length === 0 ? (
        <p className="text-[13px] text-muted">None.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {matches.map((m) => (
            <Link key={m.id} href={`/admin/matches/${m.id}`} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-card">
              <span className="font-semibold">{inr(m.agreedPrice)}</span>
              <span className="text-[13px] text-muted">{m.status}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function KV({ k, v, link }: { k: string; v: string; link?: string }) {
  const val = link ? <Link href={link} className="font-semibold underline">{v}</Link> : <span className="font-semibold">{v}</span>;
  return <div className="flex justify-between gap-3 py-0.5 text-[14px]"><span className="text-muted">{k}</span><span className="text-right">{val}</span></div>;
}
