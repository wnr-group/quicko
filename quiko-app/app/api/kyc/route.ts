import { bearerUser, ok, bad, unauth } from "@/lib/apiAuth";
import { getMyKyc, submitKyc } from "@/lib/queries/kyc";

const ID_TYPES = ["aadhaar", "pan", "passport", "driving_license"];

export async function GET(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const k = await getMyKyc(u.id);
  return ok(k ? { status: k.status, notes: k.notes } : null);
}

export async function POST(req: Request) {
  const u = await bearerUser(req);
  if (!u) return unauth();
  const b = (await req.json().catch(() => ({}))) as { idType?: string; idNumber?: string; legalName?: string };
  const idType = String(b.idType ?? "");
  const idNumber = String(b.idNumber ?? "").trim();
  const legalName = String(b.legalName ?? "").trim();
  if (!ID_TYPES.includes(idType)) return bad("Pick an ID type");
  if (idNumber.length < 4) return bad("Enter a valid ID number");
  if (legalName.length < 2) return bad("Enter the name on your ID");
  const res = await submitKyc(u.id, { idType, idNumber, legalName });
  return res.ok ? ok({ ok: true }) : bad(res.error);
}
