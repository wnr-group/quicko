import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { SendStep1 } from "@/components/SendStep1";
import { dateWindow } from "@/lib/dates";

// Public — anyone can explore travelers; login is required only to post (step 3).
export default async function SendPage() {
  const { today, tomorrow, weekOut } = dateWindow();
  return (
    <PhoneFrame>
      <TopBar title="Send a Package" back />
      <SendStep1 today={today} tomorrow={tomorrow} weekOut={weekOut} />
    </PhoneFrame>
  );
}
