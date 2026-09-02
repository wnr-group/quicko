import Link from "next/link";
import { listAdminActions } from "@/lib/queries/audit";
import { requireAdmin } from "@/lib/auth";
import { timeAgo } from "@/core/format";

const TARGET_HREF: Record<string, (id: string) => string> = {
  user: (id) => `/admin/users/${id}`,
  match: (id) => `/admin/matches/${id}`,
};

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const all = await listAdminActions(300);
  const term = q.trim().toLowerCase();
  const rows = term
    ? all.filter(
        (r) =>
          r.action.action.toLowerCase().includes(term) ||
          (r.action.detail ?? "").toLowerCase().includes(term) ||
          (r.actor.fullName ?? "").toLowerCase().includes(term),
      )
    : all;

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Audit log</h1>
      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Filter by action, actor, or detail…"
          className="flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-ink"
        />
        <button className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">Filter</button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] font-bold uppercase tracking-wide text-muted">
              <th className="px-3 py-2.5">Action</th>
              <th className="px-3 py-2.5">Actor</th>
              <th className="px-3 py-2.5">Target</th>
              <th className="px-3 py-2.5">Detail</th>
              <th className="px-3 py-2.5">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const href = r.action.targetType && r.action.targetId ? TARGET_HREF[r.action.targetType]?.(r.action.targetId) : undefined;
              return (
                <tr key={r.action.id} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-2.5 font-semibold">{r.action.action}</td>
                  <td className="px-3 py-2.5 text-muted">{r.actor.fullName ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    {href ? <Link href={href} className="text-muted underline">{r.action.targetType}</Link> : <span className="text-muted">{r.action.targetType ?? "—"}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{r.action.detail ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted">{timeAgo(r.action.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="mt-4 text-center text-sm text-muted">No matching entries.</p>}
    </>
  );
}
