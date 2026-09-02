import Link from "next/link";
import { requireSupport, isAdminProfile } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireSupport(); // support OR admin may enter; pages gate the rest
  const admin = isAdminProfile(profile);

  return (
    <div className="min-h-full bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-black text-brand">Q</span>
            <span className="font-black">{admin ? "Admin" : "Support ops"}</span>
          </div>
          <nav className="flex items-center gap-4 text-[14px] font-semibold text-muted">
            <Link href="/admin" className="hover:text-ink">Dashboard</Link>
            <Link href="/admin/search" className="hover:text-ink">Search</Link>
            <Link href="/admin/disputes" className="hover:text-ink">Disputes</Link>
            <Link href="/admin/moderation" className="hover:text-ink">Mod</Link>
            {/* Governance & money — admin only */}
            {admin && <Link href="/admin/matching" className="hover:text-ink">Match</Link>}
            {admin && <Link href="/admin/kyc" className="hover:text-ink">KYC</Link>}
            {admin && <Link href="/admin/users" className="hover:text-ink">Users</Link>}
            {admin && <Link href="/admin/transactions" className="hover:text-ink">Txns</Link>}
            {admin && <Link href="/admin/audit" className="hover:text-ink">Audit</Link>}
            <Link href="/app" className="text-ink">← App</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-6">{children}</main>
    </div>
  );
}
