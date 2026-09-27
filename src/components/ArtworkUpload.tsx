"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

export interface Uploaded {
  id: number; url: string; original_name: string;
  width: number; height: number; bytes: number;
  colours: number; placeholder: string; hint?: string;
}

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

/**
 * Artwork attachment.
 *
 * The single biggest cause of a revised quote is not seeing the artwork.
 * Screen print is priced per colour; embroidery on stitch count. Both are
 * guesses until someone looks at the file.
 *
 * So the server counts distinct colours on upload and returns a plain-English
 * recommendation, which is shown immediately. The buyer learns something
 * useful the moment they drop a file, rather than after an email exchange.
 */
export default function ArtworkUpload({
  token,
  files,
  onChange,
}: {
  token: string;
  files: Uploaded[];
  onChange: (f: Uploaded[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (list: FileList | File[]) => {
      setErr("");
      setBusy(true);
      const next = [...files];
      for (const f of Array.from(list).slice(0, 5)) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("token", token);
        try {
          const r = await fetch("/api/attachment", { method: "POST", body: fd });
          const j = await r.json();
          if (!r.ok) { setErr(j.error ?? "Upload failed"); break; }
          next.push({ ...j.file, hint: j.hint });
        } catch {
          setErr("Upload failed — check your connection.");
          break;
        }
      }
      onChange(next);
      setBusy(false);
    },
    [files, onChange, token]
  );

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-5 text-center transition ${
          drag ? "border-gold-500 bg-gold-50" : "border-sand-200 bg-white hover:border-gold-400"
        }`}
      >
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden
          onChange={(e) => e.target.files && upload(e.target.files)} />
        {busy ? (
          <p className="text-[13.5px] font-semibold text-navy-800">Reading your artwork…</p>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="mx-auto mb-1.5 size-6 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m21 15-5-5L5 20" />
            </svg>
            <p className="text-[13.5px] font-semibold text-navy-800">
              Add your logo or a reference photo
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-ink-400">
              JPG, PNG or WebP · up to 8 MB · we&apos;ll tell you which print method suits it
            </p>
          </>
        )}
      </div>

      {err && (
        <p className="mt-2 rounded-md border border-[#e5b4a2] bg-[#fdefe9] px-3 py-2 text-[12.5px] font-medium text-[#a6431f]">
          {err}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-2.5 grid gap-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white p-2">
              <span className="relative size-12 shrink-0 overflow-hidden rounded bg-sand-100">
                <Image src={f.url} alt="" fill sizes="48px" className="object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-navy-800">{f.original_name}</span>
                <span className="block text-[11px] text-ink-400">{f.width}×{f.height} · {kb(f.bytes)}</span>
                {f.hint && <span className="mt-0.5 block text-[11.5px] leading-snug text-[#8a6d1f]">{f.hint}</span>}
              </span>
              <button type="button" aria-label={`Remove ${f.original_name}`}
                onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                className="shrink-0 rounded p-1.5 text-ink-400 hover:bg-sand-100 hover:text-[#a6431f]">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11.5px] leading-relaxed text-ink-400">
        PDF, AI or CDR? Submit without it and send the file on WhatsApp with
        your reference — we cannot safely accept those through the browser.
      </p>
    </div>
  );
}
