import { signOutAction } from "@/app/login/actions";
import { IconLogout } from "@/components/icons";

// Server-action form — no client JS, no auth-provider coupling.
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        aria-label="Sign out"
        className="grid h-10 w-10 place-items-center rounded-full bg-ink text-brand transition-colors active:scale-95 hover:bg-ink-soft"
      >
        <IconLogout />
      </button>
    </form>
  );
}
