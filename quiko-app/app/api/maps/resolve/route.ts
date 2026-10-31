import { NextResponse } from "next/server";
import { coordsFromGoogleUrl, isGoogleHost, isShortHost, placeQueryFromGoogleUrl } from "@/core/mapsLink";
import { getAuthUser } from "@/lib/auth";

// Resolves a Google Maps *short* link (maps.app.goo.gl/…) to coordinates.
// Browsers can't follow it (CORS), so the server follows the redirects itself.
// SSRF guard: only Google's own hosts are ever requested, https only, and the
// redirect chain is capped.

const MAX_HOPS = 5;
// Whole-chain budget. A per-hop timeout alone lets 5 hops pin a serverless
// function for 30s.
const TOTAL_BUDGET_MS = 8000;
const allowed = (u: URL) =>
  u.protocol === "https:" && (isShortHost(u.hostname) || isGoogleHost(u.hostname));

export async function GET(req: Request) {
  // Signed-in only. This endpoint makes the server fetch an external URL on the
  // caller's behalf, and proxy.ts serves /api/* with Access-Control-Allow-Origin:*,
  // so unauthenticated it is an outbound-request amplifier any site could drive.
  // Every other route in the app is gated; this one should be too.
  if (!(await getAuthUser())) {
    return NextResponse.json({ error: "Sign in to use this." }, { status: 401 });
  }
  const raw = new URL(req.url).searchParams.get("url") ?? "";
  let url: URL;
  try { url = new URL(raw); } catch { return bad("Not a valid link."); }
  if (!allowed(url)) return bad("Only Google Maps links are supported.");

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  try {
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      if (Date.now() >= deadline) break;
      // Google hosts may already carry the coordinates in the URL itself.
      if (isGoogleHost(url.hostname)) {
        const c = coordsFromGoogleUrl(url.toString());
        if (c) return NextResponse.json(c);
      }
      const r = await fetch(url, {
        redirect: "manual",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; QuikoLinkResolver/1.0)" },
        signal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())),
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
    // Resolved to a Google page with a place name but no coordinates: hand the
    // name back so the client can find it with Mapbox search.
    const query = isGoogleHost(url.hostname) ? placeQueryFromGoogleUrl(url.toString()) : null;
    if (query) return NextResponse.json({ query });
  } catch {
    return bad("Couldn't open that link. Check your connection and try again.", 502);
  }
  return bad("Couldn't find a location in that link. Paste the full link or the coordinates.", 422);
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
