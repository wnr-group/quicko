import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// Custom JWT sessions in an httpOnly cookie. This replaces Supabase Auth.
// The whole auth-provider coupling now lives in this file + lib/otp.ts.

const COOKIE = "quiko_session";
// The role picked first after signing in. Home returns to that dashboard.
const HOME_COOKIE = "quiko_home";
export type HomeRole = "sender" | "traveler";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function createSession(profileId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profileId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());

  const c = await cookies();
  c.delete(HOME_COOKIE); // every login starts with a fresh choice
  c.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const c = await cookies();
  c.delete(COOKIE);
  c.delete(HOME_COOKIE);
}

/** Remember the first role chosen this login; later choices don't override it. */
export async function rememberHomeRole(role: HomeRole) {
  const c = await cookies();
  if (c.get(HOME_COOKIE)) return;
  // No maxAge: a browser-session cookie, gone when the browser closes.
  c.set(HOME_COOKIE, role, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
}

export async function getHomeRole(): Promise<HomeRole | null> {
  const v = (await cookies()).get(HOME_COOKIE)?.value;
  return v === "sender" || v === "traveler" ? v : null;
}

export async function getSession(): Promise<{ id: string } | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.sub ? { id: payload.sub } : null;
  } catch {
    return null; // expired / tampered
  }
}
