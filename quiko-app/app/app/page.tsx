import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SignOutButton } from "@/components/SignOutButton";
import { NotificationBell } from "@/components/NotificationBell";
import { BottomNav } from "@/components/BottomNav";
import { StatusBadge } from "@/components/StatusBadge";
import {
  IconPackage,
  IconPlane,
  IconChevronRight,
  IconArrowRight,
} from "@/components/icons";
import { requireUser, getProfile } from "@/lib/auth";
import { getMyPackages } from "@/lib/queries/packages";
import { countActiveMatches } from "@/lib/queries/matches";
import { inr, formatPhone, initials } from "@/core/format";

export default async function AppHome() {
  const user = await requireUser();
  const [profile, myPackages, matchCount] = await Promise.all([
    getProfile(),
    getMyPackages(user.id),
    countActiveMatches(user.id),
  ]);

  return (
    <PhoneFrame>
      <header className="pt-safe flex items-center justify-between px-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-sm font-bold text-brand">
            {initials(profile?.fullName, "Q")}
          </span>
          <div>
            <p className="text-[13px] text-muted">Welcome back</p>
            <h1 className="text-[17px] font-bold leading-tight">
              {profile?.fullName ?? formatPhone(profile?.phone)}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell profileId={user.id} />
          <SignOutButton />
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        <div className="mt-2 flex flex-col gap-3">
          <RoleCard
            href="/app/send"
            title="Send a Package"
            subtitle="Find a traveler on your route"
            tone="brand"
            icon={<IconPackage width={22} height={22} />}
          />
          <RoleCard
            href="/app/travel"
            title="Travel & Earn"
            subtitle="Earn on trips you're already taking"
            tone="plain"
            icon={<IconPlane width={22} height={22} />}
          />
        </div>

        <h2 className="mb-2 mt-8 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
          Your packages
        </h2>
        {myPackages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center">
            <p className="text-sm text-muted">
              No packages yet. Tap <b className="text-ink">Send a Package</b> to
              post your first one.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {myPackages.map((p) => {
              return (
                <li key={p.id}>
                  <Link
                    href={`/app/packages/${p.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card active:scale-[0.99]"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-ink">
                      <IconPackage width={20} height={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="truncate">{p.fromCity}</span>
                        <IconArrowRight width={15} height={15} className="shrink-0 text-muted" />
                        <span className="truncate">{p.toCity}</span>
                      </div>
                      <div className="text-[13px] text-muted">
                        {p.travelDate} · {p.weightKg}kg · {inr(p.offerPrice)}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav matchCount={matchCount} />
    </PhoneFrame>
  );
}

function RoleCard({
  href,
  title,
  subtitle,
  icon,
  tone,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "brand" | "plain";
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-3xl p-4 shadow-card transition-transform active:scale-[0.98] ${
        tone === "brand" ? "bg-brand" : "bg-white"
      }`}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
          tone === "brand" ? "bg-ink text-brand" : "bg-brand-soft text-ink"
        }`}
      >
        {icon}
      </span>
      <div className="flex-1">
        <div className="text-[16px] font-bold">{title}</div>
        <div className="text-[13px] text-ink-soft">{subtitle}</div>
      </div>
      <IconChevronRight className="text-ink/40" />
    </Link>
  );
}
