import Link from "next/link";
import { requireSupport } from "@/lib/auth";

export default async function SupportConsoleLayout({ children }: { children: React.ReactNode }) {
  await requireSupport(); // gate every /support route (support OR admin)

  return (
    // A staff console: wider than the phone app, but a queue and a thread don't
    // need the full 1600px the admin tables use.
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-6 px-5 py-3.5 lg:px-8">
          <Link href="/support" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-black text-brand">
              Q
            </span>
            <span className="font-black tracking-tight">Support</span>
          </Link>
          <nav className="flex items-center gap-2 text-[14px] font-semibold">
            <Link
              href="/support"
              className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-brand-soft hover:text-ink"
            >
              Queue
            </Link>
            <Link
              href="/app"
              className="rounded-full border border-line-strong px-3 py-1.5 text-ink transition-colors hover:bg-brand-soft"
            >
              &larr; App
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-5 py-6 lg:px-8">{children}</main>
    </div>
  );
}
