import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminUser } from "@/lib/queries/admin";
import { getProfile, isAdminProfile } from "@/lib/auth";
import { AdminUserActions } from "@/components/AdminUserActions";
import { inr, formatPhone, initials, timeAgo } from "@/core/format";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminUser(id);
  if (!data) notFound();
  const { profile, packages, trips, matches } = data;
  const admin = isAdminProfile(await getProfile());

  return (
    <>
      <Link href="/admin/search" className="text-[13px] font-semibold text-muted hover:text-ink">← Search</Link>

      <div className="mt-3 flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-brand">
          {initials(profile.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black">{profile.fullName ?? "—"}</h1>
            {profile.staffRole !== "user" && (
              <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">{profile.staffRole}</span>
            )}
            {profile.status === "suspended" && (
              <span className="rounded bg-error-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-error">Suspended</span>
            )}
          </div>
          <div className="text-[13px] text-muted">{formatPhone(profile.phone)}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="KYC" value={`L${profile.kycLevel}`} />
        <Stat label="Deliveries" value={profile.deliveriesCount} />
        <Stat label="Rating" value={profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : "—"} />
      </div>

      {admin && (
        <AdminUserActions
          userId={profile.id}
          status={profile.status}
          staffRole={profile.staffRole}
          fullName={profile.fullName}
        />
      )}

      <Group title={`Packages (${packages.length})`}>
        {packages.map((p) => (
          <Row key={p.id} href={`/admin/packages/${p.id}`} left={`${p.fromCity} → ${p.toCity}`} right={p.status} sub={timeAgo(p.createdAt)} />
        ))}
      </Group>
      <Group title={`Trips (${trips.length})`}>
        {trips.map((t) => (
          <Row key={t.id} href={`/admin/trips/${t.id}`} left={`${t.fromCity} → ${t.toCity}`} right={t.status} sub={timeAgo(t.createdAt)} />
        ))}
      </Group>
      <Group title={`Matches (${matches.length})`}>
        {matches.map((mt) => (
          <Row key={mt.id} href={`/admin/matches/${mt.id}`} left={inr(mt.agreedPrice)} right={mt.status} sub={timeAgo(mt.createdAt)} />
        ))}
      </Group>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-card">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-lg font-black tabular-nums">{value}</div>
    </div>
  );
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="mt-5">
      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">{title}</h2>
      {items.filter(Boolean).length === 0 ? <p className="text-[13px] text-muted">None.</p> : <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}
function Row({ href, left, right, sub }: { href: string; left: string; right: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-card">
      <div>
        <div className="font-semibold">{left}</div>
        <div className="text-[12px] text-muted">{sub}</div>
      </div>
      <span className="text-[13px] text-muted">{right}</span>
    </Link>
  );
}
