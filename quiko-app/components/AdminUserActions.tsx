"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setUserStatusAction,
  setUserRoleAction,
  forceVerifyUserAction,
  editUserNameAction,
} from "@/app/app/actions";

type Role = "user" | "support" | "admin";
type Res = { ok: true } | { ok: false; error: string };

export function AdminUserActions({
  userId,
  status,
  staffRole,
  fullName,
}: {
  userId: string;
  status: "active" | "suspended";
  staffRole: Role;
  fullName: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(fullName ?? "");

  function run(fn: () => Promise<Res>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
      <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-muted">Actions</h2>
      {error && <p className="mb-2 text-[13px] font-medium text-error">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {status === "active" ? (
          <button
            onClick={() => run(() => setUserStatusAction(userId, "suspended"))}
            disabled={pending}
            className="rounded-xl bg-error px-3.5 py-2 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-40"
          >
            Suspend
          </button>
        ) : (
          <button
            onClick={() => run(() => setUserStatusAction(userId, "active"))}
            disabled={pending}
            className="rounded-xl bg-success px-3.5 py-2 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-40"
          >
            Reinstate
          </button>
        )}

        <button
          onClick={() => run(() => forceVerifyUserAction(userId))}
          disabled={pending}
          className="rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-40"
        >
          Force-verify KYC
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[13px] font-semibold text-muted">Role</span>
        {(["user", "support", "admin"] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => run(() => setUserRoleAction(userId, r))}
            disabled={pending || r === staffRole}
            className={`rounded-lg px-2.5 py-1.5 text-[13px] font-semibold ${
              r === staffRole ? "bg-ink text-white" : "bg-neutral-100 text-ink hover:bg-neutral-200"
            } disabled:opacity-100`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="flex-1 rounded-lg border border-line px-3 py-2 text-[14px] outline-none focus:border-ink"
        />
        <button
          onClick={() => run(() => editUserNameAction(userId, name))}
          disabled={pending || name.trim() === (fullName ?? "") || name.trim().length < 2}
          className="rounded-lg bg-neutral-100 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-neutral-200 disabled:opacity-40"
        >
          Save name
        </button>
      </div>
    </div>
  );
}
