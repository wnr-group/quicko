import { redirect } from "next/navigation";
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
  if (await getProfile()) redirect(safeNext(next));

  return (
    <PhoneFrame>
      <LoginForm next={next} />
    </PhoneFrame>
  );
}
