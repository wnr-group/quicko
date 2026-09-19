import Link from "next/link";
import { requireSupport, isAdminProfile } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireSupport(); // support OR admin may enter; pages gate the rest
  const admin = isAdminProfile(profile);
  const title = admin ? "Admin" : "Support ops";

  return (
    // A console, not a phone view: sidebar on desktop, full width for tables.
    <div className="flex min-h-dvh bg-surface">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-canvas px-4 py-5 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-black text-brand">
            Q
          </span>
          <span className="font-black tracking-tight">{title}</span>
        </div>

        <AdminNav admin={admin} orientation="sidebar" />

        <Link
          href="/app"
          className="mt-auto rounded-xl border border-line-strong px-3 py-2 text-center text-[14px] font-semibold text-ink transition-colors hover:bg-brand-soft"
        >
          &larr; Back to app
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Narrow screens keep the header + a scrolling nav strip. */}
        <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-black text-brand">
                Q
              </span>
              <span className="font-black tracking-tight">{title}</span>
            </div>
            <Link href="/app" className="shrink-0 text-[14px] font-semibold text-ink">
              &larr; App
            </Link>
          </div>
          <div className="px-5 pb-2.5">
            <AdminNav admin={admin} orientation="strip" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
