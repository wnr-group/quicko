import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SignOutButton } from "@/components/SignOutButton";
import { NotificationBell } from "@/components/NotificationBell";
import { BottomNav } from "@/components/BottomNav";
import { StatusBadge } from "@/components/StatusBadge";
import { RouteCard } from "@/components/RouteCard";
import { IconPackage, IconPlane, IconChevronRight } from "@/components/icons";
import { requireUser, getProfile } from "@/lib/auth";
import { getMyPackages } from "@/lib/queries/packages";
import { countActiveMatches } from "@/lib/queries/matches";
import { inr, formatPhone, initials, placeShort, dateShort } from "@/core/format";

export default async function AppHome() {
  const user = await requireUser();
  const [profile, myPackages, matchCount] = await Promise.all([
    getProfile(),
    getMyPackages(user.id),
    countActiveMatches(user.id),
  ]);

  return (
    <PhoneFrame>
      {/* Yellow hero band — the brand surface the customer lands on. */}
      <header className="pt-safe rounded-b-3xl bg-brand px-5 pb-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-sm font-bold text-brand">
              {initials(profile?.fullName, "Q")}
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink-soft">Welcome back</p>
              <h1 className="text-[19px] font-bold leading-tight tracking-tight text-ink">
                {profile?.fullName ?? formatPhone(profile?.phone)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell profileId={user.id} />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-5">
        <div className="flex flex-col gap-3">
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

        <h2 className="mb-3 mt-8 flex items-center gap-2 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
          Your packages
          <span className="h-px flex-1 bg-line" />
        </h2>
        {myPackages.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line-strong bg-surface p-6 text-center">
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
                  <RouteCard
                    href={`/app/packages/${p.id}`}
                    from={placeShort(p.fromCity)}
                    to={placeShort(p.toCity)}
                    kind={{ icon: <IconPackage width={13} height={13} strokeWidth={2.25} />, label: "Package" }}
                    amount={inr(p.offerPrice)}
                    meta={
                      <>
                        <span className="font-bold text-ink">{dateShort(p.travelDate)}</span>{" "}
                        <span className="rounded-md bg-brand px-1.5 py-0.5 text-[12px] font-bold text-ink">
                          {p.weightKg}kg
                        </span>
                      </>
                    }
                    badge={<StatusBadge status={p.status} />}
                  />
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
      className={`flex items-center gap-4 rounded-3xl p-4 transition-transform active:scale-[0.98] ${
        tone === "brand" ? "bg-brand shadow-brand" : "bg-canvas shadow-card"
      }`}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone === "brand" ? "bg-ink text-brand" : "bg-brand text-ink"}`}
      >
        {icon}
      </span>
      <div className="flex-1">
        <div className="text-[16px] font-bold tracking-tight text-ink">{title}</div>
        <div className={`text-[13px] ${tone === "brand" ? "text-ink-soft" : "text-muted"}`}>
          {subtitle}
        </div>
      </div>
      <IconChevronRight className="text-ink/40" />
    </Link>
  );
}
