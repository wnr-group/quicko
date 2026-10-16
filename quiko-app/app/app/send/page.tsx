import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { SendStep1 } from "@/components/SendStep1";
import { ExistingItemsNotice } from "@/components/ExistingItemsNotice";
import { getAuthUser } from "@/lib/auth";
import { getMyActivePackages } from "@/lib/queries/packages";
import { dateWindow, todayIST } from "@/lib/dates";
import { dateShort, placeShort } from "@/core/format";

// Public — anyone can explore travelers; login is required only to post (step 2).
export default async function SendPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: startNew } = await searchParams;
  const { today, weekOut } = dateWindow();

  // Signed-in senders who already have an open package are asked first whether to
  // edit it or send another (`?new=1` = they chose another, and Back from Explore
  // keeps landing here without asking again).
  const user = startNew ? null : await getAuthUser();
  const existing = user ? await getMyActivePackages(user.id, todayIST()) : [];
  if (existing.length > 0) {
    return (
      <PhoneFrame>
        <TopBar title="Send a Package" back />
        <ExistingItemsNotice
          kind="package"
          openLabel="Edit this package"
          continueHref="/app/send?new=1"
          items={existing.map((p) => ({
            id: p.id,
            from: placeShort(p.fromCity),
            to: placeShort(p.toCity),
            meta: `${p.weightKg} kg · ${dateShort(p.travelDate)}${p.dateTo && p.dateTo !== p.travelDate ? ` – ${dateShort(p.dateTo)}` : ""}`,
            href: `/app/packages/${p.id}/edit`,
          }))}
        />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <TopBar title="Send a Package" back />
      <SendStep1 today={today} weekOut={weekOut} />
    </PhoneFrame>
  );
}
