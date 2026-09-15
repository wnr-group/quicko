import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { IconShieldCheck, IconStar, IconPackage, IconX } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getTravelerProfile } from "@/lib/queries/users";
import { initials, dateShort, timeAgo } from "@/core/format";

const KYC_LABELS: Record<number, string> = { 1: "Basic", 2: "Phone verified", 3: "ID verified" };

export default async function TravelerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const data = await getTravelerProfile(id);
  if (!data) notFound();
  const { profile, reviews } = data;
  const idVerified = profile.kycLevel >= 3;

  return (
    <PhoneFrame>
      <TopBar title="Traveller" back />

      {/* Yellow hero, matching the Profile screen this is reached from. */}
      <header className="rounded-b-3xl bg-brand px-5 pb-7 pt-4">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ink text-lg font-bold text-brand">
            {initials(profile.fullName)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight text-ink">
              {profile.fullName ?? "Traveller"}
            </h1>
            {/* A verified ID is the trust signal people look for: green when the
                ID is checked, red when it is not — never a neutral grey that
                reads as "fine". */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                  idVerified ? "bg-success-soft text-success" : "bg-error-soft text-error"
                }`}
              >
                {idVerified ? (
                  <IconShieldCheck width={11} height={11} />
                ) : (
                  <IconX width={11} height={11} />
                )}
                {idVerified ? KYC_LABELS[3] : `Not ID verified`}
              </span>
              <span className="text-[12px] font-medium text-ink-soft">
                member since {dateShort(new Date(profile.createdAt).toISOString().slice(0, 10))}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-5">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            icon={<IconStar width={16} height={16} />}
            label="Rating"
            value={profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : "—"}
          />
          <Stat
            icon={<IconPackage width={16} height={16} />}
            label="Deliveries"
            value={profile.deliveriesCount}
          />
          <Stat
            icon={<IconShieldCheck width={16} height={16} />}
            label="Trust"
            value={profile.trustScore}
          />
        </div>

        <h2 className="mb-3 mt-7 flex items-center gap-2 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
          Reviews ({reviews.length})
          <span className="h-px flex-1 bg-line" />
        </h2>
        {reviews.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line-strong bg-surface p-6 text-center text-sm text-muted">
            No reviews yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border-l-2 border-brand bg-canvas p-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <Stars n={Math.round(r.overall)} />
                  <span className="text-[12px] text-muted">{timeAgo(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-1.5 text-[14px] text-ink">&ldquo;{r.comment}&rdquo;</p>}
                <p className="mt-1 text-[12px] font-semibold text-muted">
                  &mdash; {r.raterName ?? "A sender"}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </PhoneFrame>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-canvas py-4 shadow-card">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-ink">{icon}</span>
      <span className="mt-1.5 text-xl font-black leading-none tabular-nums">{value}</span>
      <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          width={16}
          height={16}
          // was text-neutral-300 — the last raw neutral left on this screen
          className={i <= n ? "text-brand-strong" : "text-line-strong"}
        />
      ))}
    </span>
  );
}
