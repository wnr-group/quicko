"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Narrows the arrival window (r1..r2 params, defaulting to the step-1 window d1..d2).
export function ReachFilter({ min }: { min: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const r1 = sp.get("r1") || sp.get("d1") || min;
  const r2 = sp.get("r2") || sp.get("d2") || min;

  function set(key: "r1" | "r2", val: string) {
    const p = new URLSearchParams(sp.toString());
    p.set(key, val);
    router.replace(`${path}?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-3 rounded-2xl bg-white p-3.5 shadow-card">
      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wide text-muted">
        Should reach between
      </span>
      <div className="flex items-end gap-2">
        <input type="date" value={r1} min={min} onChange={(e) => set("r1", e.target.value)}
          className="flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-[14px] outline-none focus:border-ink" />
        <span className="pb-2.5 text-muted">–</span>
        <input type="date" value={r2} min={r1} onChange={(e) => set("r2", e.target.value)}
          className="flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-[14px] outline-none focus:border-ink" />
      </div>
    </div>
  );
}
