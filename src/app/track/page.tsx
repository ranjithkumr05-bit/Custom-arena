"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PROCESS } from "@/lib/content";
import { Wrap } from "@/components/ui";

interface Tracked {
  ref: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  qty: number;
  kind: string;
  stageIndex: number;
  lines: { product: string; fabric: string; decoration: string; qty: number }[];
  timeline: { at: string; to: string; note: string }[];
}

function TrackInner() {
  const params = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const [last4, setLast4] = useState("");
  const [found, setFound] = useState<Tracked | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const lookup = useCallback(async (value: string, digits: string) => {
    if (!value.trim()) return;
    if (!/^\d{4}$/.test(digits)) {
      setMsg("Enter the last 4 digits of the phone number used on the order.");
      return;
    }
    setBusy(true); setMsg(""); setFound(null);
    try {
      const res = await fetch(
        `/api/track?ref=${encodeURIComponent(value.trim())}&last4=${encodeURIComponent(digits)}`
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setMsg(json.error ?? "No order matches that reference and phone number.");
      } else setFound(json.rfq);
    } catch {
      setMsg("Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }, []);



  return (
    <Wrap className="max-w-[780px]">
      <form onSubmit={(e) => { e.preventDefault(); lookup(ref, last4); }} className="mb-4 grid gap-2.5 sm:grid-cols-[1fr_140px_auto]">
          <label className="grid gap-1">
            <span className="text-[12.5px] font-semibold text-navy-800">Reference</span>
            <input value={ref} onChange={(e) => setRef(e.target.value)}
              placeholder="CA-2609-0001"
              className="min-h-[48px] rounded-md border border-sand-200 px-4 text-[15px] focus:border-navy-600 focus:outline-none focus:ring-[3px] focus:ring-navy-600/12" />
          </label>
          <label className="grid gap-1">
            <span className="text-[12.5px] font-semibold text-navy-800">Phone last 4</span>
            <input value={last4} inputMode="numeric" maxLength={4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
              placeholder="3210"
              className="min-h-[48px] rounded-md border border-sand-200 px-4 text-center text-[15px] tracking-[0.3em] focus:border-navy-600 focus:outline-none focus:ring-[3px] focus:ring-navy-600/12" />
          </label>
          <button type="submit" disabled={busy}
            className="min-h-[48px] self-end rounded-md bg-navy-800 px-6 text-[15px] font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60">
            {busy ? "Checking…" : "Track"}
          </button>
        </form>

        <p className="mb-8 text-[13px] leading-relaxed text-ink-400">
          Both are required. The reference alone is not enough — references run
          in sequence, so anyone could otherwise guess their way through other
          customers&apos; orders.
        </p>

        {msg && (
          <p className="rounded-lg border border-sand-200 bg-sand-50 px-5 py-4 text-[14.5px] text-ink-500">{msg}</p>
        )}

        {found && (
          <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-md sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-sand-100 pb-5">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-ink-400">Reference</div>
                <div className="text-[24px] font-semibold text-navy-800">{found.ref}</div>
              </div>
              <div className="rounded-full bg-gold-50 px-3.5 py-1.5 text-[12.5px] font-bold uppercase tracking-wide text-[#8a6d1f]">
                {found.status.replace("_", " ")}
              </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Total quantity", `${found.qty} pcs`],
                ["Items", String(found.lines.length)],
                ["Raised", new Date(found.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[12px] uppercase tracking-wide text-ink-400">{k}</div>
                  <div className="text-[15px] font-medium text-navy-800">{v}</div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="mb-2 text-[12px] uppercase tracking-wide text-ink-400">What&apos;s in this order</div>
              <ul className="grid gap-1.5">
                {found.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3 rounded-lg bg-sand-50 px-3.5 py-2 text-[13.5px]">
                    <span className="text-navy-800">{l.product} · {l.fabric}{l.decoration !== "none" && ` · ${l.decoration}`}</span>
                    <span className="font-semibold text-navy-800">{l.qty} pcs</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-[12px] uppercase tracking-wide text-ink-400">Production stage</div>
            <ol className="mt-2.5 grid gap-1.5">
              {PROCESS.map((s, i) => {
                const done = i <= found.stageIndex;
                const current = i === found.stageIndex;
                return (
                  <li key={s.slug}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition ${
                      current ? "border-gold-300 bg-gold-50"
                        : done ? "border-sand-200 bg-sand-50" : "border-sand-100 bg-white"
                    }`}>
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                      done ? "bg-navy-800 text-gold-400" : "bg-sand-100 text-ink-400"
                    }`}>
                      {done ? "✓" : s.n}
                    </span>
                    <span className={`text-[14px] ${done ? "font-medium text-navy-800" : "text-ink-400"}`}>
                      {s.title}
                    </span>
                    {current && <span className="ml-auto text-[11.5px] font-bold uppercase tracking-wide text-gold-500">current</span>}
                  </li>
                );
              })}
            </ol>

            {found.timeline.length > 0 && (
              <div className="mt-6 border-t border-sand-100 pt-5">
                <div className="mb-2.5 text-[12px] uppercase tracking-wide text-ink-400">History</div>
                <ul className="grid gap-2">
                  {found.timeline.map((t, i) => (
                    <li key={i} className="flex gap-3 text-[13px]">
                      <span className="shrink-0 tabular-nums text-ink-400">
                        {new Date(t.at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                      <span className="text-ink-500">
                        <b className="text-navy-800">{t.to.replace("_", " ") || "created"}</b>
                        {t.note && ` — ${t.note}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
    </Wrap>
  );
}

export default function TrackPage() {
  return (
    <section className="py-14 lg:py-16">
      <Wrap className="max-w-[780px]">
        {/* Outside the Suspense boundary on purpose. useSearchParams forces
            the boundary to render its fallback during SSR, so anything inside
            it is missing from the served HTML — which left this page with no
            <h1> at all. */}
        <h1 className="mb-3 text-[clamp(28px,4vw,42px)]">Track your order</h1>
        <p className="mb-7 text-[17px] leading-relaxed text-ink-500">
          Enter the reference from your quote confirmation to see where the
          order currently sits.
        </p>
      </Wrap>
      <Suspense
        fallback={
          <Wrap className="max-w-[780px]">
            <p className="text-[14.5px] text-ink-400">Loading…</p>
          </Wrap>
        }
      >
        <TrackInner />
      </Suspense>
    </section>
  );
}
