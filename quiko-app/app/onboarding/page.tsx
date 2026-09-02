import { redirect } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { OnboardingForm } from "@/components/OnboardingForm";
import { getAuthUser, getProfile } from "@/lib/auth";

function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.fullName) redirect(safeNext(next));

  return (
    <PhoneFrame>
      <OnboardingForm phone={profile.phone} next={next} />
    </PhoneFrame>
  );
}
