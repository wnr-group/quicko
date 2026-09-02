import Link from "next/link";
import { listUnmatchedPackages } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/auth";
import { initials, timeAgo } from "@/core/format";

export default async function AdminMatchingPage() {
  await requireAdmin();
  const items = await listUnmatchedPackages();

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Manual matching</h1>
      <p className="text-sm text-muted">{items.length} package{items.length === 1 ? "" : "s"} waiting for a traveller.</p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center text-sm text-muted">
          Every package is matched. 🎉
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {items.map(({ pkg, sender }) => (
            <Link
              key={pkg.id}
              href={`/admin/matching/${pkg.id}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card active:scale-[0.99]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                {initials(sender.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{pkg.fromCity} → {pkg.toCity}</div>
                <div className="text-[13px] text-muted">{pkg.weightKg} kg · {sender.fullName ?? "—"}</div>
              </div>
              <span className="shrink-0 text-[12px] text-muted">{timeAgo(pkg.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
