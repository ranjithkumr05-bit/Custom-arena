"use client";

import { useState } from "react";
import SimpleQuote from "./SimpleQuote";
import QuoteBuilder from "./QuoteBuilder";

/**
 * Progressive disclosure.
 *
 * Simple form first, detailed builder on request. A reorder link always
 * lands on the detailed view, because the spec is already known and the
 * whole point is to reuse it.
 */
export default function QuoteFlow({
  initialProduct,
  initialKind = "quote",
  reorderRef,
}: {
  initialProduct?: string;
  initialKind?: "quote" | "sample";
  reorderRef?: string;
}) {
  const [mode, setMode] = useState<"simple" | "detailed">(reorderRef ? "detailed" : "simple");

  if (mode === "simple") {
    return (
      <SimpleQuote
        initialProduct={initialProduct}
        initialKind={initialKind}
        onSwitchToDetailed={() => setMode("detailed")}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => setMode("simple")}
        className="mb-5 inline-flex min-h-[38px] items-center gap-2 rounded-md px-2.5 -ml-2.5 text-[13.5px] font-semibold text-ink-500 transition hover:bg-sand-100 hover:text-navy-800"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5m6-6-6 6 6 6" />
        </svg>
        Back to the short form
      </button>
      <QuoteBuilder initialProduct={initialProduct} initialKind={initialKind} reorderRef={reorderRef} />
    </div>
  );
}
