import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { IconShieldCheck, IconStar } from "@/components/icons";
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

  return (
    <PhoneFrame>
      <TopBar title="Traveller" back />
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
        <div className="mt-2 flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ink text-lg font-bold text-brand">
            {initials(profile.fullName)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-xl font-black">{profile.fullName ?? "Traveller"}</h1>
              {profile.kycLevel >= 3 && <IconShieldCheck width={18} height={18} className="shrink-0 text-info" />}
            </div>
            <p className="text-[13px] text-muted">
              {KYC_LABELS[profile.kycLevel] ?? "Basic"} · member since {dateShort(new Date(profile.createdAt).toISOString().slice(0, 10))}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Rating" value={profile.ratingAvg > 0 ? `${profile.ratingAvg.toFixed(1)}★` : "—"} />
          <Stat label="Deliveries" value={profile.deliveriesCount} />
          <Stat label="Trust score" value={profile.trustScore} />
        </div>

        <h2 className="mt-7 mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">
          Reviews ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center text-sm text-muted">
            No reviews yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <Stars n={Math.round(r.overall)} />
                  <span className="text-[12px] text-muted">{timeAgo(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-1.5 text-[14px] text-ink">“{r.comment}”</p>}
                <p className="mt-1 text-[12px] font-semibold text-muted">— {r.raterName ?? "A sender"}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </PhoneFrame>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-card">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-xl font-black tabular-nums">{value}</div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} width={16} height={16} className={i <= n ? "text-brand-strong" : "text-neutral-300"} />
      ))}
    </span>
  );
}
