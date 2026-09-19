import Link from "next/link";
import { notFound } from "next/navigation";
import { candidateTripsForPackage } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/auth";
import { AdminMatchButton } from "@/components/AdminMatchButton";
import { dateShort, timeWindow, initials, inr } from "@/core/format";

/** Detour is what decides a manual match, so it is graded rather than printed
 *  as grey text where 6 km and 1305 km look the same. */
function detourTone(km: number | null) {
  if (km == null) return { cls: "bg-surface text-muted", label: "route unknown" };
  if (km <= 25) return { cls: "bg-success-soft text-success", label: `~${km} km detour` };
  if (km <= 100) return { cls: "bg-brand text-ink", label: `~${km} km detour` };
  return { cls: "bg-error-soft text-error", label: `~${km} km detour` };
}

export default async function AdminMatchingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const data = await candidateTripsForPackage(id);
  if (!data) notFound();
  const { pkg, sender, candidates } = data;

  return (
    <>
      <Link href="/admin/matching" className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; Matching queue
      </Link>

      <div className="mt-3 rounded-2xl border-l-2 border-brand bg-canvas p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight">
              {pkg.fromCity} &rarr; {pkg.toCity}
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              {pkg.description ?? "No description"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip label={`${pkg.weightKg} kg`} />
            <Chip label={inr(pkg.offerPrice)} />
            <span className="inline-flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[10px] font-bold text-brand">
                {initials(sender?.fullName)}
              </span>
              <span className="text-[12px] font-semibold">{sender?.fullName ?? "—"}</span>
            </span>
          </div>
        </div>
      </div>

      <h2 className="mb-3 mt-6 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-ink">
        Candidate trips ({candidates.length}) — closest routes first
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </h2>

      {candidates.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">
          No active trips to match right now.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {candidates.map((c, i) => {
            const tone = detourTone(c.detourKm ?? null);
            const best = i === 0 && c.detourKm != null;
            return (
              <div
                key={c.trip.id}
                className={`grid items-center gap-4 rounded-2xl bg-canvas p-4 shadow-card lg:grid-cols-[minmax(0,1fr)_200px_180px_auto] ${
                  best ? "border-l-2 border-brand" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                    {initials(c.traveler.fullName)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-bold">
                        {c.trip.fromCity} &rarr; {c.trip.toCity}
                      </span>
                      {best && (
                        <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                          Best
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[13px] text-muted">
                      {c.traveler.fullName ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="text-[13px]">
                  <div className="font-semibold text-ink">{dateShort(c.trip.travelDate)}</div>
                  <div className="text-muted">{timeWindow(c.trip.departTime)}</div>
                </div>

                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-[12px] font-bold ${tone.cls}`}
                  >
                    {tone.label}
                  </span>
                </div>

                <AdminMatchButton packageId={pkg.id} tripId={c.trip.id} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-bold text-ink">
      {label}
    </span>
  );
}
