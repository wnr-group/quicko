import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { bearerUser, ok, unauth } from "@/lib/apiAuth";

export async function GET(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const [p] = await db
    .select({ id: profiles.id, fullName: profiles.fullName, phone: profiles.phone, kycLevel: profiles.kycLevel })
    .from(profiles)
    .where(eq(profiles.id, u.id))
    .limit(1);
  if (!p) return unauth();
  return ok(p);
}
