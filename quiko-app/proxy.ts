import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CORS for the JSON API so browser-based clients (the RN web build, curl from a
// browser, etc.) can call it cross-origin. Native apps ignore CORS; this is
// purely for browsers. Scoped to /api/* only — the web app's own pages/actions
// are same-origin and unaffected.
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

export function proxy(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS });
  }
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}

export const config = { matcher: "/api/:path*" };
