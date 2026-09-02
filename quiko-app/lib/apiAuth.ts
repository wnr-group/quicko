import "server-only";
import { SignJWT, jwtVerify } from "jose";

// Bearer-token auth for the JSON API (used by the mobile app). Same JWT and
// secret as the cookie session (lib/session.ts) — just carried in the
// Authorization header instead of an httpOnly cookie.
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function signToken(profileId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profileId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export async function bearerUser(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const { payload } = await jwtVerify(m[1], key());
    return payload.sub ? { id: payload.sub } : null;
  } catch {
    return null;
  }
}

export const ok = (data: unknown, status = 200) => Response.json(data, { status });
export const bad = (error: string, status = 400) => Response.json({ error }, { status });
export const unauth = () => Response.json({ error: "Unauthorized" }, { status: 401 });
