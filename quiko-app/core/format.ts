/** Format a number as Indian Rupees, e.g. 1360 → "₹1,360". */
export function inr(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

/** "919999900001" → "+91 99999 00001". Falls back to the raw input. */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) {
    return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  }
  return phone.startsWith("+") ? phone : `+${d}`;
}

/**
 * Geocoded labels arrive as full addresses ("Coimbatore - Anaikatti Road,
 * Coimbatore", "Athipet, Thiruvallur District, Tamil Nadu"). Keep the locality
 * and the city it sits in, dropping street detail and the trailing state so a
 * row stays one line without losing which place it means.
 */
export function placeShort(label: string | null | undefined): string {
  if (!label) return "";
  const parts = label.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return label.trim();
  // "Coimbatore - Anaikatti Road" -> "Coimbatore" (street detail after the dash)
  const locality = parts[0].split(" - ")[0].trim();
  // "Thiruvallur District" -> "Thiruvallur"
  const city = (parts[1] ?? "").replace(/\s+District$/i, "").trim();
  if (!city || city.toLowerCase() === locality.toLowerCase()) return locality;
  return `${locality}, ${city}`;
}

/** "08:00" → "8:00 AM". */
export function time12(hhmm: string | null | undefined): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

/**
 * A departure/arrival time stored as the start of a 4-hour window ("08:00")
 * rendered as that window, e.g. "8 AM – 12 PM", "12–4 PM", "8 PM – 12 AM".
 */
export function timeWindow(hhmm: string | null | undefined): string {
  if (!hhmm) return "";
  const [h] = hhmm.split(":").map(Number);
  const part = (hour: number) => {
    const norm = ((hour % 24) + 24) % 24;
    const ap = norm < 12 ? "AM" : "PM";
    const h12 = norm % 12 === 0 ? 12 : norm % 12;
    return { h12, ap };
  };
  const start = part(h);
  const end = part(h + 4);
  return start.ap === end.ap
    ? `${start.h12}–${end.h12} ${end.ap}`
    : `${start.h12} ${start.ap} – ${end.h12} ${end.ap}`;
}

/** "2026-07-28" → "Tue 28 Jul". */
export function dateShort(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/**
 * Relative time like "2h ago", "3d ago". Compute server-side and pass as a
 * string to client components (React purity forbids `new Date()` in render).
 */
export function timeAgo(input: Date | string): string {
  const then = typeof input === "string" ? new Date(input) : input;
  const secs = Math.max(0, Math.floor((Date.now() - then.getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return then.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Initials from a name (or phone) for avatars. "Raj Kumar" → "RK". */
export function initials(name: string | null | undefined, fallback = "?"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const ini = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return ini || fallback;
}

const TRANSPORT_LABELS: Record<string, { label: string; emoji: string }> = {
  flight: { label: "Flight", emoji: "✈️" },
  train: { label: "Train", emoji: "🚆" },
  bus: { label: "Bus", emoji: "🚌" },
  car: { label: "Car", emoji: "🚗" },
};

export function transportLabel(mode: string) {
  return TRANSPORT_LABELS[mode] ?? TRANSPORT_LABELS.bus;
}
