import { PhoneFrame } from "@/components/PhoneFrame";
import { CreateTripForm } from "@/components/CreateTripForm";
import { requireUser } from "@/lib/auth";
import { dateWindow } from "@/lib/dates";

// The form owns its own header — it's a 2-screen wizard (route/dates, then
// transport/capacity/detour), and the back arrow needs to step back a screen
// before it steps back a page.
export default async function NewTripPage() {
  await requireUser();
  const { today } = dateWindow();
  return (
    <PhoneFrame>
      <CreateTripForm today={today} />
    </PhoneFrame>
  );
}
