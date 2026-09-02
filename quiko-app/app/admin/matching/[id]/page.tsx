import Link from "next/link";
import { notFound } from "next/navigation";
import { candidateTripsForPackage } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/auth";
import { AdminMatchButton } from "@/components/AdminMatchButton";
import { dateShort, timeWindow, initials } from "@/core/format";

export default async function AdminMatchingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const data = await candidateTripsForPackage(id);
  if (!data) notFound();
  const { pkg, sender, candidates } = data;

  return (
    <>
      <Link href="/admin/matching" className="text-[13px] font-semibold text-muted hover:text-ink">← Matching queue</Link>

      <div className="mt-3 rounded-2xl bg-white p-4 shadow-card">
        <h1 className="text-xl font-black">{pkg.fromCity} → {pkg.toCity}</h1>
        <p className="text-[13px] text-muted">
          {pkg.weightKg} kg · {pkg.description ?? "no description"} · sender {sender?.fullName ?? "—"}
        </p>
      </div>

      <h2 className="mt-5 mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">
        Candidate trips ({candidates.length}) — closest routes first
      </h2>
      {candidates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center text-sm text-muted">
          No active trips to match right now.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {candidates.map((c) => (
            <div key={c.trip.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-xs font-bold text-ink">
                {initials(c.traveler.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{c.trip.fromCity} → {c.trip.toCity}</div>
                <div className="text-[13px] text-muted">
                  {c.traveler.fullName ?? "—"} · {dateShort(c.trip.travelDate)} {timeWindow(c.trip.departTime)}
                  {c.detourKm != null ? ` · ~${c.detourKm} km detour` : " · route unknown"}
                </div>
              </div>
              <AdminMatchButton packageId={pkg.id} tripId={c.trip.id} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
