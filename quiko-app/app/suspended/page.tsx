import { SignOutButton } from "@/components/SignOutButton";

// Shown to suspended accounts. Must NOT call requireUser (would loop).
export default function SuspendedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-error-soft text-error text-2xl">⚠️</div>
      <h1 className="text-xl font-black">Account suspended</h1>
      <p className="max-w-sm text-sm text-muted">
        Your Quiko account has been suspended. If you think this is a mistake, please
        contact support and we&rsquo;ll take a look.
      </p>
      <p className="text-sm font-semibold">support@quiko.app</p>
      <div className="mt-2">
        <SignOutButton />
      </div>
    </div>
  );
}
