"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

const MAIN: Item[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/search", label: "Search" },
];

const OPS: Item[] = [
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/moderation", label: "Moderation" },
];

/** Governance and money — admin only. */
const GOVERNANCE: Item[] = [
  { href: "/admin/matching", label: "Matching" },
  { href: "/admin/kyc", label: "KYC" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/audit", label: "Audit" },
];

/**
 * Console navigation. As a sidebar on desktop, as a scrolling strip on narrow
 * screens. Labels are spelled out — the old top bar abbreviated them to "Mod"
 * and "Txns" to fit, and had no active state at all.
 */
export function AdminNav({
  admin,
  orientation,
}: {
  admin: boolean;
  orientation: "sidebar" | "strip";
}) {
  const path = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? path === "/admin" : path.startsWith(href);

  const link = (it: Item) => {
    const active = isActive(it.href);
    return (
      <Link
        key={it.href}
        href={it.href}
        aria-current={active ? "page" : undefined}
        className={
          orientation === "sidebar"
            ? `block rounded-xl px-3 py-2 text-[14px] font-semibold transition-colors ${
                active ? "bg-brand text-ink" : "text-muted hover:bg-brand-soft hover:text-ink"
              }`
            : `shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                active ? "bg-brand text-ink" : "text-muted hover:text-ink"
              }`
        }
      >
        {it.label}
      </Link>
    );
  };

  const groups: { label?: string; items: Item[] }[] = [
    { items: MAIN },
    { label: "Operations", items: OPS },
    ...(admin ? [{ label: "Governance", items: GOVERNANCE }] : []),
  ];

  if (orientation === "strip") {
    return (
      <nav className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
        {groups.flatMap((g) => g.items).map(link)}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((g, i) => (
        <div key={g.label ?? i} className="flex flex-col gap-0.5">
          {/* Section heading, not another menu row: a trailing rule and tighter
              tracking, the same pattern the rest of the app uses for headings. */}
          {g.label && (
            <p className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              {g.label}
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
            </p>
          )}
          {g.items.map(link)}
        </div>
      ))}
    </nav>
  );
}
