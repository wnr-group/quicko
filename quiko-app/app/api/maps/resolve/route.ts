import { NextResponse } from "next/server";
import { coordsFromGoogleUrl, isGoogleHost, isShortHost } from "@/core/mapsLink";

// Resolves a Google Maps *short* link (maps.app.goo.gl/…) to coordinates.
// Browsers can't follow it (CORS), so the server follows the redirects itself.
// SSRF guard: only Google's own hosts are ever requested, https only, and the
// redirect chain is capped.

const MAX_HOPS = 5;
const allowed = (u: URL) =>
  u.protocol === "https:" && (isShortHost(u.hostname) || isGoogleHost(u.hostname));

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url") ?? "";
  let url: URL;
  try { url = new URL(raw); } catch { return bad("Not a valid link."); }
  if (!allowed(url)) return bad("Only Google Maps links are supported.");

  try {
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      // Google hosts may already carry the coordinates in the URL itself.
      if (isGoogleHost(url.hostname)) {
        const c = coordsFromGoogleUrl(url.toString());
        if (c) return NextResponse.json(c);
      }
      const r = await fetch(url, {
        redirect: "manual",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; QuikoLinkResolver/1.0)" },
        signal: AbortSignal.timeout(6000),
      });
      const loc = r.headers.get("location");
      if (r.status >= 300 && r.status < 400 && loc) {
        const next = new URL(loc, url);
        if (!allowed(next)) return bad("That link redirects somewhere unsupported.");
        url = next;
        continue;
      }
      // Landed on a page without coordinates in its URL: look inside it.
      if (r.ok && isGoogleHost(url.hostname)) {
        const html = (await r.text()).slice(0, 400_000);
        const m = html.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ?? html.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m) {
          const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
          if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return NextResponse.json({ lat, lng });
        }
      }
      break;
    }
  } catch {
    return bad("Couldn't open that link. Check your connection and try again.", 502);
  }
  return bad("Couldn't find a location in that link. Paste the full link or the coordinates.", 422);
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
