import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { CreatePackageForm } from "@/components/CreatePackageForm";
import { requireUser } from "@/lib/auth";
import { dateWindow } from "@/lib/dates";

export default async function NewPackagePage() {
  await requireUser();
  const { today, tomorrow, weekOut } = dateWindow();
  return (
    <PhoneFrame>
      <TopBar title="Send a Package" back />
      <CreatePackageForm today={today} tomorrow={tomorrow} weekOut={weekOut} />
    </PhoneFrame>
  );
}
