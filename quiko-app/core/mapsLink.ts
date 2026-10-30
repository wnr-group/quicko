// Read a location out of text a user pastes from Google Maps — pure, no I/O.
// Handles plain "lat, lng", full google.* map URLs, and flags the short
// maps.app.goo.gl links (which need a redirect lookup on the server).

export type PastedLocation = { lat: number; lng: number; name?: string };
export type ParsedInput =
  | ({ kind: "coords" } & PastedLocation)
  | { kind: "short"; url: string };

const SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "g.co"]);
export const isShortHost = (h: string) => SHORT_HOSTS.has(h.toLowerCase());
export const isGoogleHost = (h: string) => /(^|\.)google\.[a-z.]{2,}$/i.test(h);

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const PAIR = String.raw`(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)`;

function pair(m: RegExpMatchArray | null, a = 1, b = 2): PastedLocation | null {
  if (!m) return null;
  const lat = parseFloat(m[a]);
  const lng = parseFloat(m[b]);
  return valid(lat, lng) ? { lat, lng } : null;
}

/** Coordinates inside a google.* URL. The place pin (!3d/!4d) beats the map
 *  centre (@lat,lng), which is just where the viewport happened to be. */
export function coordsFromGoogleUrl(raw: string): PastedLocation | null {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  const full = decodeURIComponent(u.pathname + u.search + u.hash);

  const loc =
    pair(full.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)) ??
    pair(full.match(new RegExp(`@${PAIR}`))) ??
    ["q", "query", "ll", "destination", "center", "daddr"]
      .map((k) => pair((u.searchParams.get(k) ?? "").match(new RegExp(`^${PAIR}$`))))
      .find(Boolean) ??
    null;
  if (!loc) return null;

  const place = u.pathname.match(/\/maps\/place\/([^/@]+)/);
  if (place) {
    const name = decodeURIComponent(place[1].replace(/\+/g, " ")).trim();
    // A bare coordinate pair is not a name.
    if (name && !new RegExp(`^${PAIR}$`).test(name)) loc.name = name;
  }
  return loc;
}

export function parseMapsInput(text: string): ParsedInput | null {
  const t = text.trim();
  if (!t) return null;

  const plain = t.match(new RegExp(String.raw`^\(?\s*${PAIR}\s*\)?$`));
  const p = pair(plain);
  if (p) return { kind: "coords", ...p };

  // Allow "Name https://…" / pasted share text: take the first URL in it.
  const url = t.match(/https?:\/\/\S+/)?.[0];
  if (!url) return null;
  let host: string;
  try { host = new URL(url).hostname; } catch { return null; }

  if (isShortHost(host)) return { kind: "short", url };
  if (isGoogleHost(host)) {
    const c = coordsFromGoogleUrl(url);
    return c ? { kind: "coords", ...c } : null;
  }
  return null;
}
