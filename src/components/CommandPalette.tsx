"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Doc { t: string; d: string; u: string; k: string; b: string }

/** Subsequence fuzzy match with a score favouring early, contiguous hits. */
function fuzzy(needle: string, hay: string) {
  if (!needle) return 0;
  let i = 0, score = 0, streak = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) {
    if (hay[j] === needle[i]) {
      streak++;
      score += 1 + streak * 1.6 + (j < 24 ? 3 : 0);
      i++;
    } else streak = 0;
  }
  return i === needle.length ? score : 0;
}

const KIND_STYLE: Record<string, string> = {
  Category: "bg-navy-800 text-gold-400",
  Subcategory: "bg-navy-600 text-white",
  Guide: "bg-gold-500 text-navy-900",
  Fabric: "bg-sand-200 text-ink-700",
  Branding: "bg-sand-200 text-ink-700",
  Process: "bg-sand-200 text-ink-700",
  Glossary: "bg-sand-100 text-ink-500",
  FAQ: "bg-sand-100 text-ink-500",
  Page: "bg-navy-600 text-white",
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  /** Single close path — always restores focus to the button that opened it. */
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  // Global shortcuts. Escape is handled here AND on the dialog so it works
  // regardless of where focus currently sits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === "/" && !open) {
        const el = document.activeElement?.tagName;
        if (el !== "INPUT" && el !== "TEXTAREA" && el !== "SELECT") {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, close]);

  // Close on browser back instead of leaving the user trapped.
  useEffect(() => {
    if (!open) return;
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  // Load the index once, with an error state so it can never hang on "Loading…".
  useEffect(() => {
    if (!open || loadState === "ready" || loadState === "loading") return;
    setLoadState("loading");
    fetch("/api/search")
      .then((r) => r.json())
      .then((j) => { setDocs(j.docs ?? []); setLoadState("ready"); })
      .catch(() => setLoadState("error"));
  }, [open, loadState]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else { setQ(""); setActive(0); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return docs.filter((d) => d.k === "Page" || d.k === "Category").slice(0, 8);
    return docs
      .map((d) => ({ d, s: fuzzy(needle, d.t.toLowerCase()) * 3 + (d.b.includes(needle) ? 18 : 0) + fuzzy(needle, d.b) * 0.05 }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 10)
      .map((r) => r.d);
  }, [q, docs]);

  useEffect(() => setActive(0), [q]);

  function go(d: Doc) {
    setOpen(false);
    router.push(d.u);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
    if (e.key === "Escape") { e.preventDefault(); close(); }
  }

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <>
      <button
        ref={openerRef}
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        className="hidden items-center gap-2 rounded-md border border-sand-200 px-3 py-2 text-[13.5px] text-ink-400 transition hover:border-navy-600 hover:text-navy-800 md:flex"
      >
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <span>Search</span>
        <kbd className="ml-1 rounded border border-sand-200 bg-sand-50 px-1.5 py-px font-sans text-[11px] text-ink-400">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-navy-900/45 px-4 pt-[10vh] backdrop-blur-sm"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site search"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-2.5 border-b border-sand-100 px-4">
              <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search products, fabrics, guides, terms…"
                className="w-full bg-transparent py-4 text-[16px] text-navy-800 placeholder:text-ink-400 focus:outline-none"
              />
              {/* Explicit close. The previous build relied on Escape or a
                  backdrop click — neither is discoverable on a touch screen. */}
              <button
                onClick={close}
                aria-label="Close search"
                className="-mr-1 grid size-9 shrink-0 place-items-center rounded-md text-ink-400 transition hover:bg-sand-100 hover:text-navy-800"
              >
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div ref={listRef} className="max-h-[54vh] overflow-y-auto p-2">
              {loadState === "error" ? (
                <div className="px-3 py-8 text-center">
                  <p className="mb-3 text-[14px] text-ink-500">Search index could not load.</p>
                  <button onClick={() => setLoadState("idle")}
                    className="rounded-md border border-sand-200 px-4 py-2 text-[13.5px] font-semibold text-navy-800">
                    Try again
                  </button>
                </div>
              ) : loadState === "loading" && !docs.length ? (
                <p className="px-3 py-8 text-center text-[14px] text-ink-400">Loading…</p>
              ) : results.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="mb-3 text-[14px] text-ink-400">No matches for “{q}”</p>
                  <button onClick={close}
                    className="rounded-md border border-sand-200 px-4 py-2 text-[13.5px] font-semibold text-navy-800">
                    Close and keep browsing
                  </button>
                </div>
              ) : (
                results.map((d, i) => (
                  <button
                    key={d.u + d.t}
                    data-i={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(d)}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${i === active ? "bg-sand-50" : ""}`}
                  >
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${KIND_STYLE[d.k] ?? "bg-sand-100 text-ink-500"}`}>
                      {d.k}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium text-navy-800">{d.t}</span>
                      <span className="block truncate text-[12.5px] text-ink-400">{d.d}</span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-sand-100 bg-sand-50 px-4 py-2.5 text-[11.5px] text-ink-400">
              <span className="hidden sm:inline">↑↓ navigate</span>
              <span className="hidden sm:inline">↵ open</span>
              <span>esc or tap outside to close</span>
              <span className="ml-auto">{results.length} result{results.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
