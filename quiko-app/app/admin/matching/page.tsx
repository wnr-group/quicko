import Link from "next/link";
import { listUnmatchedPackages } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/auth";
import { initials, timeAgo } from "@/core/format";

const DAY = 86_400_000;

/** Unmatched for three days or more is worth flagging. Kept out of the render
 *  body so the clock read is not an impure call inside the component. */
function isStale(createdAt: Date) {
  return Date.now() - new Date(createdAt).getTime() >= 3 * DAY;
}

export default async function AdminMatchingPage() {
  await requireAdmin();
  const items = await listUnmatchedPackages();

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Manual matching</h1>
      <p className="text-sm text-muted">
        {items.length} package{items.length === 1 ? "" : "s"} waiting for a traveller.
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">
          Every package is matched. 🎉
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          {items.map(({ pkg, sender }) => {
            // How long it has sat unmatched is the reason to act, so it is graded
            // rather than printed as grey text at the far edge of the row.
            const stale = isStale(pkg.createdAt);
            return (
              <Link
                key={pkg.id}
                href={`/admin/matching/${pkg.id}`}
                className={`grid items-center gap-4 rounded-2xl bg-canvas p-4 shadow-card transition-colors hover:bg-brand-soft lg:grid-cols-[minmax(0,1fr)_160px_140px_auto] ${
                  stale ? "border-l-2 border-error" : "border-l-2 border-brand"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                    {initials(sender.fullName)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-bold">
                      {pkg.fromCity} &rarr; {pkg.toCity}
                    </div>
                    <div className="truncate text-[13px] text-muted">{sender.fullName ?? "—"}</div>
                  </div>
                </div>

                <div>
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[12px] font-bold text-ink">
                    {pkg.weightKg} kg
                  </span>
                </div>

                <div
                  className={`text-[13px] font-semibold ${stale ? "text-error" : "text-muted"}`}
                >
                  waiting {timeAgo(pkg.createdAt)}
                </div>

                <span className="shrink-0 text-[13px] font-bold text-ink">Find traveller &rarr;</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
