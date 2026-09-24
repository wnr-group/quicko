import { notFound, redirect } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { CreatePackageForm } from "@/components/CreatePackageForm";
import { requireUser } from "@/lib/auth";
import { getOwnedPackage } from "@/lib/queries/packages";
import { dateWindow } from "@/lib/dates";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const pkg = await getOwnedPackage(id, user.id);
  if (!pkg) notFound();
  // Only active (unmatched) packages can be edited.
  if (pkg.status !== "active") redirect(`/app/packages/${id}`);
  const { today, tomorrow, weekOut } = dateWindow();

  return (
    <PhoneFrame>
      <TopBar title="Edit package" back />
      <CreatePackageForm
        today={today}
        tomorrow={tomorrow}
        weekOut={weekOut}
        packageId={pkg.id}
        initial={{
          from: { lat: pkg.fromLat, lng: pkg.fromLng, label: pkg.fromCity },
          to: { lat: pkg.toLat, lng: pkg.toLng, label: pkg.toCity },
          travelDate: pkg.travelDate,
          dateTo: pkg.dateTo,
          weightKg: pkg.weightKg,
          declaredValue: pkg.declaredValue,
          timePreference: pkg.timePreference,
          serviceLevel: pkg.serviceLevel,
          offerPrice: pkg.offerPrice,
          description: pkg.description,
          receiverName: pkg.receiverName,
          receiverPhone: pkg.receiverPhone,
        }}
      />
    </PhoneFrame>
  );
}
