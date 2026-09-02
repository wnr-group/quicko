import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminMatch } from "@/lib/queries/admin";
import { getOpenDisputeForMatch } from "@/lib/queries/disputes";
import { getProfile, isAdminProfile } from "@/lib/auth";
import { AdminMatchActions } from "@/components/AdminMatchActions";
import { inr, formatPhone, timeAgo } from "@/core/format";

const REASON_LABELS: Record<string, string> = {
  lost: "Package lost", damaged: "Damaged", wrong_otp: "OTP issue", no_show: "Traveller no-show", other: "Other",
};

const TIMELINE = ["confirmed", "paid", "picked_up", "in_transit", "delivered", "completed"];

export default async function AdminMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getAdminMatch(id);
  if (!m) notFound();
  const { match, pkg, sender, traveler, transactions, messages, eventTimes } = m;
  const dispute = match.status === "disputed" ? await getOpenDisputeForMatch(id) : null;
  const admin = isAdminProfile(await getProfile());
  const reached = TIMELINE.indexOf(match.status);
  const stageTime = (s: string) =>
    eventTimes[s]
      ? new Date(eventTimes[s]).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : null;

  return (
    <>
      <Link href="/admin/search" className="text-[13px] font-semibold text-muted hover:text-ink">← Search</Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">{pkg.fromCity} → {pkg.toCity}</h1>
        <StatusPill status={match.status} />
      </div>
      <p className="text-[12px] text-muted">Match {match.id}</p>

      {dispute && (
        <div className="mt-3 rounded-2xl border border-error/30 bg-error-soft p-4">
          <div className="text-[12px] font-bold uppercase tracking-wide text-error">Dispute open</div>
          <div className="mt-1 font-bold text-ink">{REASON_LABELS[dispute.dispute.reason] ?? dispute.dispute.reason}</div>
          {dispute.dispute.detail && <p className="mt-0.5 text-[14px] text-ink">{dispute.dispute.detail}</p>}
          <p className="mt-1 text-[12px] text-muted">
            Raised by {dispute.raiser.fullName ?? "—"} · {timeAgo(dispute.dispute.createdAt)}
          </p>
        </div>
      )}

      <AdminMatchActions matchId={match.id} status={match.status} admin={admin} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card title="Sender">
          <Party id={sender.id} name={sender.fullName} phone={sender.phone} />
        </Card>
        <Card title="Traveller">
          <Party id={traveler.id} name={traveler.fullName} phone={traveler.phone} />
        </Card>
      </div>

      <Card title="Package">
        <KV k="Contents" v={pkg.description ?? "—"} />
        <KV k="Weight" v={`${pkg.weightKg} kg`} />
        <KV k="Receiver" v={pkg.receiverName ? `${pkg.receiverName} · ${formatPhone(pkg.receiverPhone)}` : "—"} />
        <KV k="Delivery OTP" v={match.deliveryOtp ?? "—"} />
      </Card>

      <Card title="Money">
        <KV k="Agreed price" v={inr(match.agreedPrice)} />
        {match.detourKm > 0 && (
          <KV
            k={`Detour +${match.detourKm} km`}
            v={match.detourSelfCollect ? "self-collect (₹0)" : match.detourOptedOut ? "opted out (₹0)" : `${inr(match.detourFee)} included`}
          />
        )}
      </Card>

      {(match.pickupPhotoUrl || match.deliveryPhotoUrl) && (
        <Card title="Proof photos">
          <div className="flex flex-wrap gap-3">
            {match.pickupPhotoUrl && <Proof label="Pickup" src={match.pickupPhotoUrl} />}
            {match.deliveryPhotoUrl && <Proof label="Delivery" src={match.deliveryPhotoUrl} />}
          </div>
        </Card>
      )}

      <Card title="Timeline">
        <ol className="flex flex-col gap-1.5">
          {TIMELINE.map((s, i) => (
            <li key={s} className="flex items-center gap-2 text-[13px]">
              <span className={`h-2.5 w-2.5 rounded-full ${i <= reached ? "bg-ink" : "bg-neutral-300"}`} />
              <span className={i <= reached ? "font-semibold text-ink" : "text-muted"}>{s.replace("_", " ")}</span>
              {stageTime(s) && <span className="ml-auto tabular-nums text-[12px] text-muted">{stageTime(s)}</span>}
            </li>
          ))}
        </ol>
      </Card>

      <Card title={`Transactions (${transactions.length})`}>
        {transactions.length === 0 ? (
          <p className="text-[13px] text-muted">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-wide text-muted">
                <tr><th className="py-1 pr-3">Type</th><th className="pr-3">Status</th><th className="pr-3">Amount</th><th className="pr-3">Provider</th><th>When</th></tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t border-line/60">
                    <td className="py-1.5 pr-3 font-semibold">{t.type}</td>
                    <td className="pr-3">{t.status}</td>
                    <td className="pr-3 tabular-nums">{inr(t.amount)}</td>
                    <td className="pr-3 text-muted">{t.provider ?? "—"}</td>
                    <td className="text-muted">{timeAgo(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={`Chat (${messages.length})`}>
        {messages.length === 0 ? (
          <p className="text-[13px] text-muted">No messages.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {messages.map((msg) => {
              const who = msg.senderId === match.senderId ? sender.fullName ?? "Sender" : traveler.fullName ?? "Traveller";
              return (
                <div key={msg.id} className="text-[13px]">
                  <span className="font-semibold">{who}: </span>
                  <span>{msg.body}</span>
                  <span className="ml-1 text-[11px] text-muted">· {timeAgo(msg.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3 py-0.5 text-[14px]"><span className="text-muted">{k}</span><span className="text-right font-semibold">{v}</span></div>;
}
function Party({ id, name, phone }: { id: string; name: string | null; phone: string }) {
  return (
    <Link href={`/admin/users/${id}`} className="flex items-center justify-between">
      <span className="font-bold">{name ?? "—"}</span>
      <span className="text-[13px] text-muted">{formatPhone(phone)} →</span>
    </Link>
  );
}
function Proof({ label, src }: { label: string; src: string }) {
  return (
    <a href={src} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${label} proof`} className="h-28 w-28 rounded-xl object-cover shadow-card" />
      <span className="text-[11px] font-semibold text-muted">{label}</span>
    </a>
  );
}
function StatusPill({ status }: { status: string }) {
  const tone =
    status === "disputed" ? "bg-error-soft text-error"
      : status === "cancelled" ? "bg-neutral-100 text-muted"
      : status === "completed" || status === "delivered" ? "bg-success-soft text-success"
      : "bg-brand text-ink";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{status}</span>;
}
