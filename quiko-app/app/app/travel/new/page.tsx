import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { CreateTripForm } from "@/components/CreateTripForm";
import { requireUser } from "@/lib/auth";
import { dateWindow } from "@/lib/dates";

export default async function NewTripPage() {
  await requireUser();
  const { today } = dateWindow();
  return (
    <PhoneFrame>
      <TopBar title="Post a trip" back />
      <CreateTripForm today={today} />
    </PhoneFrame>
  );
}
