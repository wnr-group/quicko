import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { SignOutButton } from "@/components/SignOutButton";
import { ProfileEditor } from "@/components/ProfileEditor";
import { IconShieldCheck, IconPackage, IconStar, IconChevronRight, IconClock, IconX } from "@/components/icons";
import { requireUser, getProfile, isAdminProfile, isSupportProfile } from "@/lib/auth";
import { getMyPackages } from "@/lib/queries/packages";
import { countActiveMatches } from "@/lib/queries/matches";
import { getMyKyc } from "@/lib/queries/kyc";
import { signOutAction } from "@/app/login/actions";
import { formatPhone, initials } from "@/core/format";

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, myPackages, matchCount, kyc] = await Promise.all([
    getProfile(),
    getMyPackages(user.id),
    countActiveMatches(user.id),
    getMyKyc(user.id),
  ]);
  const name = profile?.fullName ?? "You";

  return (
    <PhoneFrame>
      <header className="pt-safe flex items-center justify-between px-5 pb-2">
        <h1 className="text-[17px] font-bold">Profile</h1>
        <SignOutButton />
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        <div className="mt-4 flex flex-col items-center text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-ink text-2xl font-black text-brand">
            {initials(name, "Q")}
          </span>
          <div className="mt-3">
            <ProfileEditor name={name} email={profile?.email ?? null} />
          </div>
          <p className="mt-2 text-sm text-muted">{formatPhone(profile?.phone)}</p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat icon={<IconPackage width={18} height={18} />} label="Packages" value={String(myPackages.length)} />
          <Stat icon={<IconStar width={18} height={18} />} label="Rating" value={profile && profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : "New"} />
          <Stat icon={<IconShieldCheck width={18} height={18} />} label="KYC" value={`L${profile?.kycLevel ?? 1}`} />
        </div>

        <Link href="/app/verify" className="mt-6 flex items-center gap-3 rounded-3xl bg-white p-5 shadow-card active:scale-[0.99]">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
            kyc?.status === "verified" ? "bg-success-soft text-success"
              : kyc?.status === "pending" ? "bg-brand-soft text-ink"
              : "bg-neutral-100 text-ink"
          }`}>
            {kyc?.status === "pending" ? <IconClock width={20} height={20} />
              : kyc?.status === "rejected" ? <IconX width={20} height={20} />
              : <IconShieldCheck width={20} height={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold">
              {kyc?.status === "verified" ? "Identity verified"
                : kyc?.status === "pending" ? "Verification under review"
                : kyc?.status === "rejected" ? "Verification needs another look"
                : "Verify your identity"}
            </div>
            <div className="text-[13px] text-muted">
              {kyc?.status === "verified"
                ? "You have a trusted badge."
                : "Add an ID to earn a trusted badge & higher limits."}
            </div>
          </div>
          <IconChevronRight width={18} height={18} className="shrink-0 text-muted" />
        </Link>

        {profile && (
          <Link href={`/app/travelers/${profile.id}`} className="mt-3 flex items-center justify-between rounded-3xl bg-white p-4 shadow-card active:scale-[0.99]">
            <span className="text-[15px] font-semibold">View your public profile</span>
            <IconChevronRight width={18} height={18} className="text-muted" />
          </Link>
        )}

        <Link href="/app/support" className="mt-3 flex items-center justify-between rounded-3xl bg-white p-4 shadow-card active:scale-[0.99]">
          <span className="text-[15px] font-semibold">Get help / Support</span>
          <IconChevronRight width={18} height={18} className="text-muted" />
        </Link>

        {isSupportProfile(profile) && (
          <Link href="/support" className="mt-3 flex items-center justify-center gap-1.5 rounded-3xl bg-white p-4 text-[15px] font-semibold text-ink shadow-card active:scale-[0.99]">
            Open support console
            <IconChevronRight width={18} height={18} />
          </Link>
        )}

        {isSupportProfile(profile) && (
          <Link href="/admin" className="mt-3 flex items-center justify-center gap-1.5 rounded-3xl bg-ink p-4 text-[15px] font-semibold text-white shadow-card active:scale-[0.99]">
            {isAdminProfile(profile) ? "Open admin panel" : "Open ops console"}
            <IconChevronRight width={18} height={18} />
          </Link>
        )}

        <div className="mt-6">
          <SignOutBig />
        </div>
      </main>

      <BottomNav matchCount={matchCount} />
    </PhoneFrame>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white py-4 shadow-card">
      <span className="text-muted">{icon}</span>
      <span className="mt-1 text-xl font-black">{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}

function SignOutBig() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full rounded-2xl border border-error-soft bg-error-soft py-3.5 text-[15px] font-semibold text-error active:scale-[0.98]"
      >
        Sign out
      </button>
    </form>
  );
}
