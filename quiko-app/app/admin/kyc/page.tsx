import { KycReviewActions } from "@/components/KycReviewActions";
import { listPendingKyc } from "@/lib/queries/kyc";
import { requireAdmin } from "@/lib/auth";
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
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center text-sm text-muted">
          Nothing to review. 🎉
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {items.map(({ kyc, profile }) => (
            <div key={kyc.id} className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                  {initials(profile.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{profile.fullName ?? "—"}</div>
                  <div className="text-[13px] text-muted">{formatPhone(profile.phone)}</div>
                </div>
                <div className="text-right text-[12px] text-muted">{timeAgo(kyc.createdAt)}</div>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[13px]">
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
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{k}</dt>
      <dd className="mt-0.5 font-semibold">{v}</dd>
    </div>
  );
}
