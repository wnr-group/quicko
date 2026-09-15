"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { IconShieldCheck, IconClock, IconX } from "@/components/icons";
import { submitKycAction } from "@/app/app/actions";

const ID_TYPES = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "pan", label: "PAN" },
  { value: "passport", label: "Passport" },
  { value: "driving_license", label: "Driving licence" },
];

export function KycForm({
  status,
  notes,
}: {
  status: "pending" | "verified" | "rejected" | null;
  notes: string | null;
}) {
  const router = useRouter();
  const [idType, setIdType] = useState("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [legalName, setLegalName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status === "verified") {
    return (
      <Banner tone="ok" icon={<IconShieldCheck width={24} height={24} />} title="Identity verified">
        You have a verified badge. Senders and travellers can see you&rsquo;re trusted.
      </Banner>
    );
  }
  if (status === "pending") {
    return (
      <Banner tone="wait" icon={<IconClock width={24} height={24} />} title="Under review">
        We&rsquo;re checking your document. This usually takes a little while — we&rsquo;ll
        notify you when it&rsquo;s done.
      </Banner>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await submitKycAction({ idType, idNumber, legalName });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  const ready = idNumber.trim().length >= 4 && legalName.trim().length >= 2;

  return (
    <div className="flex flex-col gap-3">
      {status === "rejected" && (
        <Banner tone="bad" icon={<IconX width={22} height={22} />} title="Previous attempt rejected">
          {notes || "Your last submission couldn't be verified. Please re-check and submit again."}
        </Banner>
      )}

      <Card>
        <Label>ID type</Label>
        <div className="grid grid-cols-2 gap-2">
          {ID_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => setIdType(t.value)}
              className={`rounded-xl border py-2.5 text-[14px] font-semibold transition-colors ${
                idType === t.value ? "border-ink bg-brand text-ink" : "border-line bg-canvas text-ink"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <Label>ID number</Label>
        <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
          placeholder="Number on your document" maxLength={40}
          className="w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-3 text-[15px] outline-none focus:border-ink" />
      </Card>

      <Card>
        <Label>Name on ID</Label>
        <input value={legalName} onChange={(e) => setLegalName(e.target.value)}
          placeholder="Full name as printed" maxLength={80}
          className="w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-3 text-[15px] outline-none focus:border-ink" />
      </Card>

      {error && <p className="rounded-xl bg-error-soft px-3 py-2 text-sm font-medium text-error">{error}</p>}

      <Button variant="brand" onClick={submit} disabled={!ready || pending}>
        {pending ? "Submitting…" : "Submit for verification"}
      </Button>
      <p className="px-2 text-center text-[13px] leading-snug text-muted">
        Your ID is used only to verify your identity. In this build, submissions are
        reviewed manually.
      </p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl bg-canvas p-4 shadow-card">{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-2.5 block text-[13px] font-bold uppercase tracking-wide text-ink">{children}</span>;
}
function Banner({ tone, icon, title, children }: {
  tone: "ok" | "wait" | "bad"; icon: React.ReactNode; title: string; children: React.ReactNode;
}) {
  const bg = tone === "ok" ? "bg-success-soft" : tone === "bad" ? "bg-error-soft" : "bg-brand-soft";
  const fg = tone === "ok" ? "text-success" : tone === "bad" ? "text-error" : "text-ink";
  return (
    <div className={`rounded-3xl ${bg} p-5`}>
      <div className={`flex items-center gap-2 ${fg}`}>
        {icon}
        <span className="text-[17px] font-black">{title}</span>
      </div>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}
