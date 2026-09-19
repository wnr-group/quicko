import { KycReviewActions } from "@/components/KycReviewActions";
import { listPendingKyc } from "@/lib/queries/kyc";
import { requireAdmin } from "@/lib/auth";
import { Empty } from "@/components/adminkit";
import { formatPhone, initials, timeAgo } from "@/core/format";

const ID_LABELS: Record<string, string> = {
  aadhaar: "Aadhaar",
  pan: "PAN",
  passport: "Passport",
  driving_license: "Driving licence",
};

export default async function AdminKycPage() {
  await requireAdmin();
  const items = await listPendingKyc();

  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">KYC queue</h1>
      <p className="text-sm text-muted">Review identity submissions.</p>

      {items.length === 0 ? (
        <Empty>Nothing to review. 🎉</Empty>
      ) : (
        // Two across on a console — a review card is short, so one per row wasted
        // most of the screen and pushed the queue below the fold.
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {items.map(({ kyc, profile }) => (
            <div
              key={kyc.id}
              className="rounded-2xl border-l-2 border-brand bg-canvas p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                  {initials(profile.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{profile.fullName ?? "—"}</div>
                  <div className="text-[13px] text-muted">{formatPhone(profile.phone)}</div>
                </div>
                <div className="shrink-0 text-[12px] tabular-nums text-muted">
                  {timeAgo(kyc.createdAt)}
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3 text-[13px]">
                <Field k="ID type" v={ID_LABELS[kyc.idType ?? ""] ?? kyc.idType ?? "—"} />
                <Field k="ID number" v={kyc.idNumber ?? "—"} />
                <Field k="Name on ID" v={kyc.legalName ?? "—"} />
              </dl>

              <KycReviewActions kycId={kyc.id} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{k}</dt>
      <dd className="mt-0.5 break-words font-semibold">{v}</dd>
    </div>
  );
}
