import type { TimePreference } from "@/core/types";
import type { ServiceLevel } from "@/core/pricing";

// The explore-first flow carries the chosen route + date window through the URL
// (steps: /app/send → /explore → /details), so no half-created DB drafts.
export type SendParams = {
  from: { lat: number; lng: number; label: string };
  to: { lat: number; lng: number; label: string };
  timePreference: TimePreference;
  dateFrom: string;
  dateTo: string;
  weightKg: number;
  serviceLevel: ServiceLevel;
};

export function parseSendParams(
  sp: Record<string, string | string[] | undefined>,
): SendParams | null {
  const num = (v: unknown) => Number(Array.isArray(v) ? v[0] : v);
  const str = (v: unknown) => (Array.isArray(v) ? v[0] : (v as string)) ?? "";
  const fla = num(sp.fla), flo = num(sp.flo), tla = num(sp.tla), tlo = num(sp.tlo);
  if ([fla, flo, tla, tlo].some(Number.isNaN)) return null;
  const tp = str(sp.tp) as TimePreference;
  const sl = str(sp.sl);
  const kg = num(sp.kg);
  return {
    from: { lat: fla, lng: flo, label: str(sp.fl) || "Pickup" },
    to: { lat: tla, lng: tlo, label: str(sp.tl) || "Destination" },
    timePreference: (["same_day", "next_day", "flexible"] as string[]).includes(tp)
      ? tp
      : "next_day",
    dateFrom: str(sp.d1),
    dateTo: str(sp.d2),
    weightKg: Number.isFinite(kg) ? Math.min(15, Math.max(1, Math.round(kg))) : 1,
    serviceLevel: (["flexible", "standard", "fast", "express"] as string[]).includes(sl)
      ? (sl as ServiceLevel)
      : "standard",
  };
}

export function toSendQuery(p: SendParams): string {
  return new URLSearchParams({
    fl: p.from.label, fla: String(p.from.lat), flo: String(p.from.lng),
    tl: p.to.label, tla: String(p.to.lat), tlo: String(p.to.lng),
    tp: p.timePreference, d1: p.dateFrom, d2: p.dateTo,
    kg: String(p.weightKg), sl: p.serviceLevel,
  }).toString();
}
