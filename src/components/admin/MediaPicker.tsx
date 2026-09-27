"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export interface MediaItem {
  id: number;
  url: string;
  filename: string;
  original_name: string;
  bytes: number;
  width: number;
  height: number;
  alt: string;
  placeholder: string;
  folder: string;
  created_at: string;
}

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

/**
 * Media library + picker.
 *
 * Doubles as a standalone library (Media tab) and a modal picker invoked from
 * the catalog editor. Drag-and-drop, paste-from-clipboard, folder filtering,
 * and the repo's shipped images listed alongside uploads so the picker is
 * useful on a fresh install before anything has been uploaded.
 */
export default function MediaPicker({
  open,
  onClose,
  onPick,
  folder = "general",
  title = "Choose an image",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
  folder?: string;
  title?: string;
}) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [seed, setSeed] = useState<{ url: string; label: string }[]>([]);
  const [folders, setFolders] = useState<{ folder: string; n: number }[]>([]);
  const [tab, setTab] = useState<"uploads" | "shipped">("uploads");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/media");
    if (!r.ok) return;
    const j = await r.json();
    setMedia(j.media ?? []);
    setSeed(j.seed ?? []);
    setFolders(j.folders ?? []);
    if (!(j.media ?? []).length) setTab("shipped");
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      setErr("");
      setBusy(true);
      let totalSaved = 0;
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("folder", folder);
        const r = await fetch("/api/admin/media", { method: "POST", body: fd });
        const j = await r.json();
        if (!r.ok) { setErr(j.error ?? "Upload failed"); break; }
        totalSaved += j.savedBytes ?? 0;
      }
      setBusy(false);
      setSaved(totalSaved || null);
      setTab("uploads");
      load();
    },
    [folder, load]
  );

  // Paste an image straight from the clipboard.
  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) upload(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, upload]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  async function remove(id: number) {
    await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    load();
  }

  if (!open) return null;

  const items = tab === "uploads" ? media : seed;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-navy-900/55 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-[940px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* header */}
        <div className="flex items-center gap-3 border-b border-sand-200 px-5 py-3.5">
          <h2 className="text-[16px] font-semibold text-navy-800">{title}</h2>
          <div className="ml-auto flex gap-1">
            {(["uploads", "shipped"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`min-h-[34px] rounded-md px-3 text-[13px] font-semibold transition ${
                  tab === t ? "bg-navy-800 text-white" : "text-ink-500 hover:bg-sand-100"
                }`}>
                {t === "uploads" ? `Uploads (${media.length})` : `Shipped (${seed.length})`}
              </button>
            ))}
          </div>
          <button onClick={onClose} aria-label="Close"
            className="grid size-9 place-items-center rounded-md text-ink-400 hover:bg-sand-100 hover:text-navy-800">
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* dropzone */}
        <div className="border-b border-sand-200 p-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-5 py-6 text-center transition ${
              drag ? "border-gold-500 bg-gold-50" : "border-sand-200 bg-sand-50 hover:border-gold-400"
            }`}
          >
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden
              onChange={(e) => e.target.files && upload(e.target.files)} />
            {busy ? (
              <p className="text-[14px] font-semibold text-navy-800">Uploading and optimising…</p>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-navy-800">
                  Drop images here, click to browse, or paste from clipboard
                </p>
                <p className="mt-1 text-[12.5px] text-ink-400">
                  JPG, PNG, WebP or AVIF · up to 12 MB · auto-converted to WebP and resized to 2000px
                </p>
              </>
            )}
          </div>
          {err && (
            <p className="mt-2.5 rounded-md border border-[#e5b4a2] bg-[#fdefe9] px-3.5 py-2 text-[13px] font-medium text-[#a6431f]">
              {err}
            </p>
          )}
          {saved !== null && saved > 0 && (
            <p className="mt-2.5 text-[12.5px] text-[#1a7a43]">
              Optimised — saved {kb(saved)} versus the original upload.
            </p>
          )}
        </div>

        {/* folder chips */}
        {tab === "uploads" && folders.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b border-sand-100 px-4 py-2.5">
            {folders.map((f) => (
              <span key={f.folder} className="rounded-full bg-sand-100 px-2.5 py-1 text-[11.5px] font-semibold text-ink-500">
                {f.folder} · {f.n}
              </span>
            ))}
          </div>
        )}

        {/* grid */}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.length === 0 && (
            <p className="col-span-full py-12 text-center text-[14px] text-ink-400">
              {tab === "uploads" ? "No uploads yet — drop a file above." : "No shipped images found."}
            </p>
          )}

          {items.map((m) => {
            const url = "url" in m ? m.url : "";
            const isUpload = tab === "uploads";
            const um = m as MediaItem;
            return (
              <div key={url} className="group overflow-hidden rounded-xl border border-sand-200 bg-white">
                <button onClick={() => { onPick(url); onClose(); }}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-sand-100">
                  <Image src={url} alt="" fill sizes="220px" className="object-cover transition group-hover:scale-105" />
                  <span className="absolute inset-0 grid place-items-center bg-navy-900/0 opacity-0 transition group-hover:bg-navy-900/45 group-hover:opacity-100">
                    <span className="rounded-md bg-gold-500 px-3 py-1.5 text-[12.5px] font-bold text-navy-900">
                      Use this
                    </span>
                  </span>
                </button>
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-medium text-navy-800">
                      {isUpload ? um.original_name || um.filename : (m as { label: string }).label}
                    </span>
                    {isUpload && (
                      <span className="block text-[10.5px] text-ink-400">
                        {um.width}×{um.height} · {kb(um.bytes)}
                      </span>
                    )}
                  </span>
                  {isUpload && (
                    <button onClick={() => remove(um.id)} aria-label="Delete"
                      className="shrink-0 rounded p-1 text-ink-400 hover:bg-sand-100 hover:text-[#a6431f]">
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
