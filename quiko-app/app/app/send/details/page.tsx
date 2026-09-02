import { redirect } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { ExploreDetailsForm } from "@/components/ExploreDetailsForm";
import { getAuthUser, getProfile } from "@/lib/auth";
import { getTripWithTraveler } from "@/lib/queries/trips";
import { parseSendParams } from "@/lib/sendParams";
import { timeWindow, dateShort } from "@/core/format";

export default async function SendDetailsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsed = parseSendParams(sp);
  if (!parsed) redirect("/app/send");

  // Reconstruct this URL so login/onboarding can return the user right here.
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") qs.set(k, v);
  const here = `/app/send/details?${qs.toString()}`;

  // Login gate — posting requires an account (new users register with name + email).
  const user = await getAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(here)}`);
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(here)}`);
  if (!profile.fullName) redirect(`/onboarding?next=${encodeURIComponent(here)}`);

  const tripId = typeof sp.tripId === "string" ? sp.tripId : undefined;
  const notify = sp.notify === "1";

  let travelerName: string | undefined;
  let travelerWhen: string | undefined;
  if (tripId) {
    const row = await getTripWithTraveler(tripId);
    if (!row) redirect(`/app/send/explore?${qs.toString()}`);
    travelerName = row!.travelerName ?? "Traveler";
    travelerWhen = `Arrives ${dateShort(row!.trip.arriveDate ?? row!.trip.travelDate)} · ${timeWindow(row!.trip.arriveTime)}`;
  }

  return (
    <PhoneFrame>
      <TopBar title={notify ? "Add package details" : "Request traveler"} back />
      <ExploreDetailsForm
        params={parsed}
        tripId={tripId}
        notify={notify}
        travelerName={travelerName}
        travelerWhen={travelerWhen}
      />
    </PhoneFrame>
  );
}
