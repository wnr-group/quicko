import type { PickupStatus } from "@/components/useDefaultPickup";

/** Status line under the route fields while the default pickup is resolved. */
export function PickupHint({
  status, message, retry, hasPickup,
}: { status: PickupStatus; message: string | null; retry: () => void; hasPickup: boolean }) {
  if (hasPickup) return null;
  if (status === "locating")
    return <p role="status" className="mt-2 text-[13px] font-medium text-muted">Finding your current location…</p>;
  if (status === "failed")
    return (
      <p role="alert" className="mt-2 text-[13px] font-medium text-muted">
        {message}{" "}
        <button type="button" onClick={retry} className="font-bold text-ink underline underline-offset-2">
          Try again
        </button>
      </p>
    );
  return null;
}
