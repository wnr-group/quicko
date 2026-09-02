"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTS = [
  { k: "trust", label: "Best match" },
  { k: "rating", label: "Top rated" },
  { k: "deliveries", label: "Most trips" },
];

export function SortTabs() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const cur = sp.get("sort") ?? "trust";

  return (
    <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
      {OPTS.map((o) => {
        const active = cur === o.k;
        return (
          <button
            key={o.k}
            onClick={() => {
              const p = new URLSearchParams(sp.toString());
              p.set("sort", o.k);
              router.replace(`${path}?${p.toString()}`, { scroll: false });
            }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              active ? "bg-ink text-white" : "border border-line bg-white text-muted"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
