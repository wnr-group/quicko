import { placeShort } from "@/core/format";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { StatusBadge } from "@/components/StatusBadge";
import { RouteCard } from "@/components/RouteCard";
import { IconSparkles, IconPackage, IconPlane } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getUserMatches, countActiveMatches } from "@/lib/queries/matches";

export default async function MatchesPage() {
  const user = await requireUser();
  const [rows, active] = await Promise.all([
    getUserMatches(user.id),
    countActiveMatches(user.id),
  ]);

  return (
    <PhoneFrame>
      <header className="pt-safe rounded-b-3xl bg-brand px-5 pb-7">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-ink">Matches</h1>
            <p className="text-sm font-semibold text-ink-soft">Packages you&rsquo;re sending &amp; carrying.</p>
          </div>
          <NotificationBell profileId={user.id} />
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {rows.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-ink">
              <IconSparkles width={26} height={26} />
            </span>
            <p className="mt-4 text-[15px] font-semibold">No matches yet</p>
            <p className="mt-1 max-w-[16rem] text-sm text-muted">
              When a sender and traveler pair up, it shows up here.
            </p>
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-2.5">
            {rows.map(({ match, package: pkg, counterpart, role, href }) => {
              const RoleIcon = role === "sender" ? IconPlane : IconPackage;
              return (
                <li key={match.id}>
                  <RouteCard
                    href={href}
                    from={placeShort(pkg.fromCity)}
                    to={placeShort(pkg.toCity)}
                    kind={{
                      icon: <RoleIcon width={13} height={13} strokeWidth={2.25} />,
                      label: role === "sender" ? "Sending" : "Carrying",
                      tone: role === "sender" ? "package" : "trip",
                    }}
                    meta={
                      <>
                        {role === "sender" ? "Carried by" : "Sender"}{" "}
                        {counterpart.fullName ?? "—"}
                      </>
                    }
                    badge={<StatusBadge status={match.status} />}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav matchCount={active} />
    </PhoneFrame>
  );
}
