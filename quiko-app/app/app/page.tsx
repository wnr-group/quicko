import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { NotificationBell } from "@/components/NotificationBell";
import { BottomNav } from "@/components/BottomNav";
import { StatusBadge } from "@/components/StatusBadge";
import { RouteCard } from "@/components/RouteCard";
import { IconPackage, IconPlane, IconChevronRight, TRANSPORT_ICONS_SOLID } from "@/components/icons";
import { requireUser, getProfile } from "@/lib/auth";
import { getMyPackages } from "@/lib/queries/packages";
import { getMyTrips } from "@/lib/queries/trips";
import { countActiveMatches } from "@/lib/queries/matches";
import { getIncomingForUser } from "@/lib/queries/requests";
import { unreadMessageCount } from "@/lib/queries/notifications";
import { IncomingRequestsPopup } from "@/components/IncomingRequestsPopup";
import { inr, formatPhone, initials, placeShort, dateShort, timeWindow } from "@/core/format";

export default async function AppHome() {
  const user = await requireUser();
  const [profile, myPackages, myTrips, matchCount, incoming, messageCount] = await Promise.all([
    getProfile(),
    getMyPackages(user.id),
    getMyTrips(user.id),
    countActiveMatches(user.id),
    getIncomingForUser(user.id),
    unreadMessageCount(user.id),
  ]);

  return (
    <PhoneFrame>
      {/* Yellow hero band — the brand surface the customer lands on. */}
      <header className="pt-safe rounded-b-3xl bg-brand px-5 pb-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Profile lives behind the avatar now (it's no longer a tab). */}
            <Link href="/app/profile" aria-label="Open your profile"
              className="grid h-11 w-11 place-items-center rounded-full bg-ink text-sm font-bold text-brand shadow-card">
              {initials(profile?.fullName, "Q")}
            </Link>
            <div>
              <p className="text-[13px] font-semibold text-ink-soft">Welcome back</p>
              <h1 className="text-[19px] font-bold leading-tight tracking-tight text-ink">
                {profile?.fullName ?? formatPhone(profile?.phone)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell profileId={user.id} />
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

        {myPackages.length === 0 && myTrips.length === 0 && (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-line-strong bg-surface p-6 text-center">
            <p className="text-sm text-muted">
              Nothing yet. Tap <b className="text-ink">Send a Package</b> to post a
              package, or <b className="text-ink">Travel &amp; Earn</b> to post a trip.
            </p>
          </div>
        )}

        {myPackages.length > 0 && (
          <>
            <h2 className="mb-3 mt-8 flex items-center gap-2 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
              Your packages
              <span className="h-px flex-1 bg-line" />
            </h2>
            <ul className="flex flex-col gap-2.5">
              {myPackages.map((p) => {
                return (
                  <li key={p.id}>
                    <RouteCard
                      href={`/app/packages/${p.id}`}
                      from={placeShort(p.fromCity)}
                      to={placeShort(p.toCity)}
                      kind={{ icon: <IconPackage width={13} height={13} strokeWidth={2.25} />, label: "Package" }}
                      // Price stays hidden until a traveller has been matched and accepted.
                      amount={["matched", "in_transit", "delivered"].includes(p.status) ? inr(p.offerPrice) : undefined}
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
          </>
        )}

        {myTrips.length > 0 && (
          <>
            <h2 className="mb-3 mt-8 flex items-center gap-2 px-1 text-[13px] font-bold uppercase tracking-wide text-ink">
              Your trips
              <span className="h-px flex-1 bg-line" />
            </h2>
            <ul className="flex flex-col gap-2.5">
              {myTrips.map((t) => {
                const Transport = TRANSPORT_ICONS_SOLID[t.transport] ?? TRANSPORT_ICONS_SOLID.bus;
                return (
                  <li key={t.id}>
                    <RouteCard
                      href={`/app/travel/trips/${t.id}`}
                      from={placeShort(t.fromCity)}
                      to={placeShort(t.toCity)}
                      kind={{ icon: <Transport width={14} height={14} />, label: "Trip", tone: "trip" }}
                      amount={
                        <span className="rounded-lg bg-brand px-2 py-1 text-[13px] font-bold text-ink">
                          {t.spareKg}kg free
                        </span>
                      }
                      meta={
                        <span className="font-bold text-ink">
                          {dateShort(t.travelDate)} · {timeWindow(t.departTime)}
                          <span className="font-semibold text-muted"> · of {t.capacityKg}kg</span>
                        </span>
                      }
                      badge={<StatusBadge status={t.status} />}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>

      <BottomNav matchCount={matchCount} messageCount={messageCount} />
      {/* Anything waiting on my answer pops up here, for senders and travellers alike. */}
      <IncomingRequestsPopup initial={incoming} />
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
