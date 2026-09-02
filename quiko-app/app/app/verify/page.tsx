import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { KycForm } from "@/components/KycForm";
import { requireUser } from "@/lib/auth";
import { getMyKyc } from "@/lib/queries/kyc";

export default async function VerifyPage() {
  const user = await requireUser();
  const kyc = await getMyKyc(user.id);

  return (
    <PhoneFrame>
      <TopBar title="Verify your identity" back />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10">
        <p className="mb-4 mt-2 text-[14px] leading-relaxed text-ink-soft">
          Verifying your identity earns you a trusted badge and higher limits. It
          reassures the people you send with or carry for.
        </p>
        <KycForm status={kyc?.status ?? null} notes={kyc?.notes ?? null} />
      </div>
    </PhoneFrame>
  );
}
