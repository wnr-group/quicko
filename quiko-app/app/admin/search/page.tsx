import Link from "next/link";
import { adminSearch } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminHeading, FilterBar } from "@/components/adminkit";
import { formatPhone } from "@/core/format";

export default async function AdminSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const res = q.trim() ? await adminSearch(q) : null;

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Search</h1>
      <FilterBar name="q" defaultValue={q} autoFocus placeholder="Name, phone, city, or an ID…" label="Search" />

      {res && (
        <>
          {res.matchId && (
            <Link
              href={`/admin/matches/${res.matchId}`}
              className="mt-5 flex max-w-[640px] items-center justify-between rounded-2xl bg-brand p-4 font-bold shadow-brand transition-transform active:scale-[0.99]"
            >
              Open match {res.matchId.slice(0, 8)}…
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )}

          {/* Three result columns — a console has room to show users, packages and
              trips together instead of stacking them down the page. */}
          <div className="grid items-start gap-6 xl:grid-cols-3">
            <Section title={`Users (${res.users.length})`}>
              {res.users.map((u) => (
                <Row key={u.id} href={`/admin/users/${u.id}`} left={u.fullName ?? formatPhone(u.phone)} sub={formatPhone(u.phone)} />
              ))}
            </Section>

            <Section title={`Packages (${res.packages.length})`}>
              {res.packages.map((p) => (
                <Row
                  key={p.id}
                  href={`/admin/packages/${p.id}`}
                  left={`${p.fromCity} → ${p.toCity}`}
                  status={p.status}
                />
              ))}
            </Section>

            <Section title={`Trips (${res.trips.length})`}>
              {res.trips.map((t) => (
                <Row
                  key={t.id}
                  href={`/admin/trips/${t.id}`}
                  left={`${t.fromCity} → ${t.toCity}`}
                  status={t.status}
                />
              ))}
            </Section>
          </div>
        </>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const empty = items.filter(Boolean).length === 0;
  return (
    <div>
      <AdminHeading>{title}</AdminHeading>
      {empty ? (
        <p className="rounded-2xl border-2 border-dashed border-line-strong bg-surface p-5 text-center text-[13px] text-muted">
          None.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-canvas shadow-card">{children}</div>
      )}
    </div>
  );
}

function Row({
  href,
  left,
  sub,
  status,
}: {
  href: string;
  left: string;
  sub?: string;
  status?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-line px-4 py-2.5 transition-colors last:border-0 hover:bg-brand-soft"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{left}</span>
        {sub && <span className="block text-[12px] text-muted">{sub}</span>}
      </span>
      {status && <StatusBadge status={status} />}
    </Link>
  );
}
