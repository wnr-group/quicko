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
    <div className="mt-4 rounded-2xl bg-canvas p-5 shadow-card">
      <h2 className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-ink">
        Actions
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </h2>
      {error && <p className="mb-3 text-[13px] font-medium text-error">{error}</p>}

      {/* Three labelled groups on one row. Stacked unlabelled rows left the name
          field stretching the full width of the console. */}
      <div className="grid gap-5 md:grid-cols-3">
        <Group label="Account">
          {status === "active" ? (
            <button
              onClick={() => run(() => setUserStatusAction(userId, "suspended"))}
              disabled={pending}
              className="rounded-xl bg-error px-3.5 py-2 text-[13px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-40"
            >
              Suspend
            </button>
          ) : (
            <button
              onClick={() => run(() => setUserStatusAction(userId, "active"))}
              disabled={pending}
              className="rounded-xl bg-success px-3.5 py-2 text-[13px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-40"
            >
              Reinstate
            </button>
          )}
          <button
            onClick={() => run(() => forceVerifyUserAction(userId))}
            disabled={pending}
            className="rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-brand transition-transform active:scale-95 disabled:opacity-40"
          >
            Force-verify KYC
          </button>
        </Group>

        <Group label="Staff role">
          {(["user", "support", "admin"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => run(() => setUserRoleAction(userId, r))}
              disabled={pending || r === staffRole}
              aria-pressed={r === staffRole}
              className={`rounded-lg px-2.5 py-2 text-[13px] font-semibold capitalize transition-colors ${
                r === staffRole
                  ? "bg-brand text-ink"
                  : "bg-surface text-ink hover:bg-brand-soft"
              } disabled:opacity-100`}
            >
              {r}
            </button>
          ))}
        </Group>

        <Group label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="min-w-0 flex-1 rounded-lg border border-line-strong px-3 py-2 text-[14px] outline-none transition-colors focus:border-ink"
          />
          <button
            onClick={() => run(() => editUserNameAction(userId, name))}
            disabled={pending || name.trim() === (fullName ?? "") || name.trim().length < 2}
            className="shrink-0 rounded-lg bg-ink px-3 py-2 text-[13px] font-semibold text-brand transition-colors disabled:bg-surface disabled:text-muted"
          >
            Save
          </button>
        </Group>
      </div>
    </div>
  );
}

/** A labelled row of controls, so each group is identifiable and aligned. */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
