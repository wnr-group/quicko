import { NextResponse } from "next/server";
import { rememberHomeRole } from "@/lib/session";

// Records the first role picked after login (so Home returns to that dashboard),
// then forwards to it.
export async function GET(req: Request, { params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (role !== "sender" && role !== "traveler") {
    return NextResponse.redirect(new URL("/app", req.url));
  }
  await rememberHomeRole(role);
  return NextResponse.redirect(new URL(role === "sender" ? "/app/send" : "/app/travel", req.url));
}
