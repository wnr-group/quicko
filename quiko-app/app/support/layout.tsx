import Link from "next/link";
import { requireSupport } from "@/lib/auth";

export default async function SupportConsoleLayout({ children }: { children: React.ReactNode }) {
  await requireSupport(); // gate every /support route (support OR admin)

  return (
    <div className="min-h-full bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-black text-brand">Q</span>
            <span className="font-black">Support</span>
          </div>
          <nav className="flex items-center gap-4 text-[14px] font-semibold text-muted">
            <Link href="/support" className="hover:text-ink">Queue</Link>
            <Link href="/app" className="text-ink">← App</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-6">{children}</main>
    </div>
  );
}
