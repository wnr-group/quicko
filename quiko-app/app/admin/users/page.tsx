import Link from "next/link";
import { listUsers } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/auth";
import { formatPhone } from "@/core/format";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await listUsers();

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">Users</h1>
      <p className="text-sm text-muted">{users.length} registered.</p>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] font-bold uppercase tracking-wide text-muted">
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">Phone</th>
              <th className="px-3 py-2.5 text-center">KYC</th>
              <th className="px-3 py-2.5 text-center">Trips&nbsp;done</th>
              <th className="px-3 py-2.5 text-center">Rating</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line/60 last:border-0">
                <td className="px-3 py-2.5 font-semibold">
                  <Link href={`/admin/users/${u.id}`} className="underline-offset-2 hover:underline">
                    {u.fullName ?? <span className="text-muted">—</span>}
                  </Link>
                  {u.isAdmin && <span className="ml-1.5 rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-brand">ADMIN</span>}
                </td>
                <td className="px-3 py-2.5 text-muted">{formatPhone(u.phone)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    u.kycLevel >= 3 ? "bg-success-soft text-success" : "bg-neutral-100 text-muted"
                  }`}>
                    {u.kycLevel >= 3 ? "Verified" : `L${u.kycLevel}`}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums">{u.deliveriesCount}</td>
                <td className="px-3 py-2.5 text-center tabular-nums">
                  {u.ratingAvg > 0 ? u.ratingAvg.toFixed(1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
