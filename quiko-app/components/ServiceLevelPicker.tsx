"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, Label, Segmented, SERVICE_OPTIONS } from "@/components/formkit";
import type { ServiceLevel } from "@/core/pricing";

const HINTS: Record<ServiceLevel, string> = {
  flexible: "Flexible saves you 35% — you wait for a matching journey.",
  standard: "Standard — the balanced default.",
  fast: "Fast leans toward quicker journeys for a small premium.",
  express: "Express prioritises the fastest travellers, at a premium.",
};

// Service level lives in the URL (`sl`) so it survives the login round-trip.
export function ServiceLevelPicker({ value }: { value: ServiceLevel }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();

  function set(v: ServiceLevel) {
    const p = new URLSearchParams(sp.toString());
    p.set("sl", v);
    router.replace(`${path}?${p.toString()}`, { scroll: false });
  }

  return (
    <Card>
      <Label>Service level</Label>
      <Segmented options={SERVICE_OPTIONS} value={value} onChange={set} />
      <p className="mt-2.5 text-[13px] leading-snug text-muted">{HINTS[value]}</p>
    </Card>
  );
}
