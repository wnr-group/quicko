"use client";

import { useRef, useState } from "react";

/** Camera/file capture that downscales to a small JPEG data URI (kept < ~1 MB). */
export function PhotoCapture({
  label,
  value,
  onCapture,
}: {
  label: string;
  value: string | null;
  onCapture: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setBusy(true);
    try {
      onCapture(await downscale(file, 1000, 0.7));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="proof" className="h-16 w-16 rounded-xl object-cover" />
          <button type="button" onClick={() => inputRef.current?.click()} className="text-[13px] font-semibold text-muted underline">
            Retake
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-3 text-[14px] font-semibold text-muted disabled:opacity-50"
        >
          {busy ? "Processing…" : `📷 ${label}`}
        </button>
      )}
    </div>
  );
}

function downscale(file: File, max: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
