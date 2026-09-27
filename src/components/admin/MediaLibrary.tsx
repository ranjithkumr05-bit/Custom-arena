"use client";

import { useState } from "react";
import MediaPicker from "./MediaPicker";

/**
 * The media library as a full tab. Reuses the picker component so there is a
 * single implementation of upload, optimisation and deletion.
 */
export default function MediaLibrary() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-sand-200 bg-white p-6">
        <h2 className="mb-1.5 text-[19px]">Media library</h2>
        <p className="mb-5 max-w-[620px] text-[14.5px] leading-relaxed text-ink-500">
          Every upload is re-encoded to WebP, capped at 2000px wide and stripped
          of EXIF metadata — phone photos routinely carry GPS coordinates, and
          those should not end up on a public site. A 20px inline placeholder is
          generated so cards never flash empty while loading.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="min-h-[46px] rounded-md bg-navy-800 px-5 text-[14.5px] font-semibold text-white transition hover:bg-navy-700"
        >
          Open media library
        </button>
      </div>

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={() => {}}
        folder="general"
        title="Media library"
      />
    </div>
  );
}
