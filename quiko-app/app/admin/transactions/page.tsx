import Link from "next/link";
import { listRecentTransactions } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/auth";
import { inr, timeAgo } from "@/core/format";

export default async function AdminTransactionsPage() {
  await requireAdmin();
  const txns = await listRecentTransactions();

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Transactions</h1>
      <p className="text-sm text-muted">Most recent {txns.length} across all matches.</p>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-canvas shadow-card">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] font-bold uppercase tracking-wide text-muted">
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
              <th className="px-3 py-2.5">Provider</th>
              <th className="px-3 py-2.5">When</th>
              <th className="px-3 py-2.5">Match</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id} className="border-b border-line/60 last:border-0">
                <td className="px-3 py-2.5 font-semibold">{t.type}</td>
                <td className="px-3 py-2.5">{t.status}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{inr(t.amount)}</td>
                <td className="px-3 py-2.5 text-muted">{t.provider ?? "—"}</td>
                <td className="px-3 py-2.5 text-muted">{timeAgo(t.createdAt)}</td>
                <td className="px-3 py-2.5">
                  <Link href={`/admin/matches/${t.matchId}`} className="text-muted underline">{t.matchId.slice(0, 8)}…</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
