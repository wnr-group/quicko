import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { CreateTripForm } from "@/components/CreateTripForm";
import { ExistingItemsNotice } from "@/components/ExistingItemsNotice";
import { requireUser } from "@/lib/auth";
import { getMyActiveTrips } from "@/lib/queries/trips";
import { dateWindow, todayIST } from "@/lib/dates";
import { dateShort, placeShort } from "@/core/format";

// The form owns its own header — it's a 2-screen wizard (route/dates, then
// transport/capacity/detour), and the back arrow needs to step back a screen
// before it steps back a page.
export default async function NewTripPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: startNew } = await searchParams;
  const user = await requireUser();
  const { today } = dateWindow();

  // Already have an open trip? Ask before planning another (`?new=1` = they chose to).
  const existing = startNew ? [] : await getMyActiveTrips(user.id, todayIST());
  if (existing.length > 0) {
    return (
      <PhoneFrame>
        <TopBar title="Post a trip" back />
        <ExistingItemsNotice
          kind="trip"
          openLabel="Open this trip"
          continueHref="/app/travel/new?new=1"
          items={existing.map((t) => ({
            id: t.id,
            from: placeShort(t.fromCity),
            to: placeShort(t.toCity),
            meta: `${dateShort(t.travelDate)} · ${t.capacityKg} kg capacity`,
            href: `/app/travel/trips/${t.id}`,
          }))}
        />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <CreateTripForm today={today} />
    </PhoneFrame>
  );
}
