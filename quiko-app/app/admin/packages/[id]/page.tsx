import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminPackage } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { Panel, KV } from "@/components/adminkit";
import { inr, formatPhone, timeAgo } from "@/core/format";

export default async function AdminPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminPackage(id);
  if (!data) notFound();
  const { pkg, sender, matches } = data;

  return (
    <>
      <Link href="/admin/search" className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; Search
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">
          {pkg.fromCity} &rarr; {pkg.toCity}
        </h1>
        <StatusBadge status={pkg.status} />
      </div>
      <p className="text-[12px] text-muted">Package {pkg.id}</p>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel title="Package" accent>
            <KV
              k="Sender"
              v={sender?.fullName ? `${sender.fullName} · ${formatPhone(sender.phone)}` : "—"}
              link={sender ? `/admin/users/${sender.id}` : undefined}
            />
            <KV k="Contents" v={pkg.description ?? "—"} />
            <KV k="Weight" v={`${pkg.weightKg} kg`} />
            <KV
              k="Receiver"
              v={pkg.receiverName ? `${pkg.receiverName} · ${formatPhone(pkg.receiverPhone)}` : "—"}
            />
            <KV k="Max price" v={pkg.maxPrice ? inr(pkg.maxPrice) : "—"} />
            <KV k="Created" v={timeAgo(pkg.createdAt)} />
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
