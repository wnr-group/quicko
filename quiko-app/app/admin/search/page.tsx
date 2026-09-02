import Link from "next/link";
import { adminSearch } from "@/lib/queries/admin";
import { formatPhone } from "@/core/format";

export default async function AdminSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const res = q.trim() ? await adminSearch(q) : null;

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Search</h1>
      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Name, phone, city, or an ID…"
          className="flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-ink"
        />
        <button className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">Search</button>
      </form>

      {res && (
        <div className="mt-5 flex flex-col gap-5">
          {res.matchId && (
            <Link href={`/admin/matches/${res.matchId}`} className="rounded-2xl bg-brand p-4 font-bold shadow-card">
              Open match {res.matchId.slice(0, 8)}… →
            </Link>
          )}

          <Section title={`Users (${res.users.length})`}>
            {res.users.map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-card">
                <span className="font-semibold">{u.fullName ?? formatPhone(u.phone)}</span>
                <span className="text-[13px] text-muted">{formatPhone(u.phone)}</span>
              </Link>
            ))}
          </Section>

          <Section title={`Packages (${res.packages.length})`}>
            {res.packages.map((p) => (
              <Link key={p.id} href={`/admin/packages/${p.id}`} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-card">
                <span className="font-semibold">{p.fromCity} → {p.toCity}</span>
                <span className="text-[13px] text-muted">{p.status}</span>
              </Link>
            ))}
          </Section>

          <Section title={`Trips (${res.trips.length})`}>
            {res.trips.map((t) => (
              <Link key={t.id} href={`/admin/trips/${t.id}`} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-card">
                <span className="font-semibold">{t.fromCity} → {t.toCity}</span>
                <span className="text-[13px] text-muted">{t.status}</span>
              </Link>
            ))}
          </Section>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div>
      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">{title}</h2>
      {items.filter(Boolean).length === 0 ? (
        <p className="text-[13px] text-muted">None.</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </div>
  );
}
