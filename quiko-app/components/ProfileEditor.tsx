"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { IconEdit } from "@/components/icons";
import { updateProfileAction } from "@/app/app/actions";

export function ProfileEditor({
  name,
  email,
}: {
  name: string;
  email: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nameV, setNameV] = useState(name);
  const [emailV, setEmailV] = useState(email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailV.trim());

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateProfileAction(nameV, emailV);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else setError(res.error);
    });
  }

  if (!editing) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-black">{name}</h1>
          <button
            onClick={() => { setNameV(name); setEmailV(email ?? ""); setEditing(true); }}
            aria-label="Edit profile"
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-neutral-100"
          >
            <IconEdit width={17} height={17} />
          </button>
        </div>
        <p className="mt-0.5 text-[13px] text-muted">{email || "Add an email"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[300px] flex-col gap-2">
      <input autoFocus value={nameV} onChange={(e) => setNameV(e.target.value)} maxLength={60}
        placeholder="Full name"
        className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-center text-lg font-bold outline-none focus:border-ink" />
      <input value={emailV} onChange={(e) => setEmailV(e.target.value)} inputMode="email" maxLength={120}
        placeholder="Email address"
        className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-center text-[15px] outline-none focus:border-ink" />
      {error && <p className="text-center text-sm text-error">{error}</p>}
      <div className="mt-1 flex gap-2">
        <div className="flex-1">
          <Button variant="ghost" onClick={() => setEditing(false)} disabled={pending}>Cancel</Button>
        </div>
        <div className="flex-1">
          <Button onClick={save} disabled={pending || nameV.trim().length < 2 || !emailOk}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
