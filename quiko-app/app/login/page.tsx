import { redirect, unstable_rethrow } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { LoginForm } from "@/components/LoginForm";
import { getProfile } from "@/lib/auth";

function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Already fully signed in → skip login (see requireUser self-heal note).
  // This is a convenience, so it must never be able to BLOCK the login screen:
  // getProfile() hits the database whenever a session cookie is present, so an
  // unreachable database used to 500 this page for exactly the people holding a
  // stale cookie — locking them out of the one screen that could fix it. Fall
  // through to the form instead.
  let signedIn = false;
  try {
    signedIn = !!(await getProfile());
  } catch (e) {
    unstable_rethrow(e); // never swallow Next's own control-flow errors
    console.error("[login] profile lookup failed, showing the form anyway:", e);
  }
  if (signedIn) redirect(safeNext(next));

  return (
    <PhoneFrame>
      <LoginForm next={next} />
    </PhoneFrame>
  );
}
