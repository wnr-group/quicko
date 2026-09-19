"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconPlus, IconUser, IconSparkles } from "@/components/icons";

// Native-style bottom tab bar for the top-level app screens.
export function BottomNav({ matchCount = 0 }: { matchCount?: number }) {
  const path = usePathname();
  const isHome = path === "/app";
  const isMatches = path.startsWith("/app/matches");
  const isProfile = path.startsWith("/app/profile");

  return (
    <nav className="pb-safe sticky bottom-0 z-20 mt-auto flex items-center justify-around border-t border-line bg-canvas/95 px-5 pt-2 backdrop-blur-md">
      <Tab href="/app" active={isHome} label="Home">
        <IconHome />
      </Tab>

      <Tab href="/app/matches" active={isMatches} label="Matches" badge={matchCount}>
        <IconSparkles />
      </Tab>

      <Link
        href="/app/send"
        aria-label="Send a package"
        className="grid h-14 w-14 -translate-y-3 place-items-center rounded-full bg-brand text-ink shadow-brand transition-transform active:scale-95 hover:bg-brand-strong"
      >
        <IconPlus width={26} height={26} />
      </Link>

      <Tab href="/app/profile" active={isProfile} label="Profile">
        <IconUser />
      </Tab>
    </nav>
  );
}

function Tab({
  href,
  active,
  label,
  badge = 0,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative flex w-14 flex-col items-center gap-0.5 py-1 text-[11px] font-bold transition-colors ${
        active ? "text-ink" : "text-muted hover:text-ink"
      }`}
    >
      <span className="relative">
        {children}
        {badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-brand">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}
