import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminPackage } from "@/lib/queries/admin";
import { inr, formatPhone, timeAgo } from "@/core/format";

export default async function AdminPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminPackage(id);
  if (!data) notFound();
  const { pkg, sender, matches } = data;

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">{pkg.fromCity} → {pkg.toCity}</h1>
      <p className="text-[12px] text-muted">Package {pkg.id}</p>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow-card">
        <KV k="Status" v={pkg.status} />
        <KV k="Sender" v={sender?.fullName ? `${sender.fullName} · ${formatPhone(sender.phone)}` : "—"} link={sender ? `/admin/users/${sender.id}` : undefined} />
        <KV k="Contents" v={pkg.description ?? "—"} />
        <KV k="Weight" v={`${pkg.weightKg} kg`} />
        <KV k="Receiver" v={pkg.receiverName ? `${pkg.receiverName} · ${formatPhone(pkg.receiverPhone)}` : "—"} />
        <KV k="Max price" v={pkg.maxPrice ? inr(pkg.maxPrice) : "—"} />
        <KV k="Created" v={timeAgo(pkg.createdAt)} />
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
