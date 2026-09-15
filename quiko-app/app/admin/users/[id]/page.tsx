import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminUser } from "@/lib/queries/admin";
import { getProfile, isAdminProfile } from "@/lib/auth";
import { AdminUserActions } from "@/components/AdminUserActions";
import { StatusBadge } from "@/components/StatusBadge";
import { inr, formatPhone, initials, timeAgo, dateShort } from "@/core/format";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminUser(id);
  if (!data) notFound();
  const { profile, packages, trips, matches } = data;
  const admin = isAdminProfile(await getProfile());

  return (
    <>
      <Link href="/admin/search" className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; Search
      </Link>

      {/* Identity and the numbers that describe the account, on one row — the
          detail was previously split across a header and three large tiles. */}
      <div className="mt-3 rounded-2xl border-l-2 border-brand bg-canvas p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-base font-bold text-brand">
              {initials(profile.fullName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-black tracking-tight">
                  {profile.fullName ?? "—"}
                </h1>
                {profile.staffRole !== "user" && (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                    {profile.staffRole}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    profile.status === "suspended"
                      ? "bg-error-soft text-error"
                      : "bg-success-soft text-success"
                  }`}
                >
                  {profile.status}
                </span>
              </div>
              <dl className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
                <Field k="Phone" v={formatPhone(profile.phone)} />
                <Field k="Email" v={profile.email ?? "—"} />
                <Field
                  k="Joined"
                  v={dateShort(new Date(profile.createdAt).toISOString().slice(0, 10))}
                />
              </dl>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Stat label="KYC" value={`L${profile.kycLevel}`} />
            <Stat label="Deliveries" value={profile.deliveriesCount} />
            <Stat
              label="Rating"
              value={profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : "—"}
            />
            <Stat label="Trust" value={profile.trustScore} />
          </div>
        </div>
      </div>

      {admin && (
        <AdminUserActions
          userId={profile.id}
          status={profile.status}
          staffRole={profile.staffRole}
          fullName={profile.fullName}
        />
      )}

      {/* Three columns instead of one long stack — the account's whole history
          is visible without scrolling on a console-sized screen. */}
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <Group title="Packages" count={packages.length}>
          {packages.map((p) => (
            <Row
              key={p.id}
              href={`/admin/packages/${p.id}`}
              left={`${p.fromCity} → ${p.toCity}`}
              status={p.status}
              sub={timeAgo(p.createdAt)}
            />
          ))}
        </Group>
        <Group title="Trips" count={trips.length}>
          {trips.map((t) => (
            <Row
              key={t.id}
              href={`/admin/trips/${t.id}`}
              left={`${t.fromCity} → ${t.toCity}`}
              status={t.status}
              sub={timeAgo(t.createdAt)}
            />
          ))}
        </Group>
        <Group title="Matches" count={matches.length}>
          {matches.map((mt) => (
            <Row
              key={mt.id}
              href={`/admin/matches/${mt.id}`}
              left={inr(mt.agreedPrice)}
              status={mt.status}
              sub={timeAgo(mt.createdAt)}
            />
          ))}
        </Group>
      </div>
    </>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{k}</dt>
      <dd className="truncate font-semibold text-ink">{v}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-[84px] rounded-xl bg-surface px-3 py-2 text-center">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-lg font-black leading-none tabular-nums">{value}</div>
    </div>
  );
}

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-canvas shadow-card">
      <h2 className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide text-ink">
        {title}
        <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] tabular-nums">{count}</span>
      </h2>
      {count === 0 ? (
        <p className="px-4 py-5 text-center text-[13px] text-muted">None.</p>
      ) : (
        <div className="max-h-[28rem] overflow-y-auto">{children}</div>
      )}
    </section>
  );
}

function Row({
  href,
  left,
  status,
  sub,
}: {
  href: string;
  left: string;
  status: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-line px-4 py-2.5 transition-colors last:border-0 hover:bg-brand-soft"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{left}</span>
        <span className="block text-[11px] text-muted">{sub}</span>
      </span>
      <StatusBadge status={status} />
    </Link>
  );
}
