import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { StatusBadge } from "@/components/StatusBadge";
import { IconArrowRight, IconSparkles, IconPackage, IconPlane } from "@/components/icons";
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
      <header className="pt-safe flex items-start justify-between px-5 pb-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Matches</h1>
          <p className="text-sm text-muted">Packages you&rsquo;re sending &amp; carrying.</p>
        </div>
        <NotificationBell profileId={user.id} />
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        {rows.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-ink">
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
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card active:scale-[0.99]"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-ink">
                      <RoleIcon width={20} height={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="truncate">{pkg.fromCity}</span>
                        <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
                        <span className="truncate">{pkg.toCity}</span>
                      </div>
                      <div className="text-[13px] text-muted">
                        {role === "sender" ? "Carried by" : "Sender"} {counterpart.fullName ?? "—"}
                        {" · "}
                        <span className="font-semibold text-ink">
                          {role === "sender" ? "Sending" : "Carrying"}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={match.status} />
                  </Link>
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
