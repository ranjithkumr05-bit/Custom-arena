"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPicker from "./MediaPicker";

interface Sub {
  slug: string; title: string; blurb: string; image: string;
  published: boolean; sort: number; edited: boolean; parentSlug: string;
  needsArt: boolean;
}
interface Cat {
  slug: string; title: string; nav: string; hero: string; heraAlt?: string; heroAlt: string;
  summary: string; intro: string; published: boolean; sort: number; edited: boolean;
  subcategories: Sub[];
}
interface Ev { id: number; at: string; actor: string; key: string; field: string; old_v: string; new_v: string }

const field =
  "min-h-[38px] w-full rounded-md border border-sand-200 px-2.5 text-[13.5px] text-ink-700 focus:border-navy-600 focus:outline-none focus:ring-[3px] focus:ring-navy-600/10";

export default function CatalogEditor({
  catalog: initial,
  history: initialHistory,
  art,
}: {
  catalog: Cat[];
  history: Ev[];
  art: { total: number; pending: number; done: number };
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState(initial);
  const [history, setHistory] = useState(initialHistory);
  const [openCat, setOpenCat] = useState<string | null>(initial[0]?.slug ?? null);
  const [picker, setPicker] = useState<{ cat: string; sub?: string } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);

  async function save(
    kind: "category" | "subcategory",
    cat: string,
    sub: string | undefined,
    patch: Record<string, unknown>
  ) {
    const id = sub ? `${cat}/${sub}` : cat;
    setSaving(id);
    const r = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, cat, sub, patch }),
    });
    const j = await r.json();
    setSaving(null);
    if (!r.ok) { setFlash(j.error ?? "Save failed"); return; }
    setCatalog(j.catalog);
    setFlash("Saved — the public page has been refreshed.");
    setTimeout(() => setFlash(""), 2600);
    refreshHistory();
    router.refresh();
  }

  async function reset(kind: "category" | "subcategory", cat: string, sub?: string) {
    const r = await fetch("/api/admin/catalog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, cat, sub }),
    });
    const j = await r.json();
    if (r.ok) {
      setCatalog(j.catalog);
      setFlash("Reverted to the original.");
      setTimeout(() => setFlash(""), 2600);
      refreshHistory();
      router.refresh();
    }
  }

  async function refreshHistory() {
    const r = await fetch("/api/admin/catalog");
    if (r.ok) setHistory((await r.json()).history ?? []);
  }

  function pick(url: string) {
    if (!picker) return;
    if (picker.sub) save("subcategory", picker.cat, picker.sub, { image: url });
    else save("category", picker.cat, undefined, { hero: url });
  }

  const pending = catalog.reduce(
    (a, c) => a + c.subcategories.filter((s) => s.needsArt).length,
    0
  );
  const done = art.total - pending;
  const pct = Math.round((done / art.total) * 100);

  const shown = onlyPending
    ? catalog
        .map((c) => ({ ...c, subcategories: c.subcategories.filter((s) => s.needsArt) }))
        .filter((c) => c.subcategories.length > 0)
    : catalog;

  return (
    <div className="grid gap-4">
      {/* ---- photo progress ---- */}
      <div className="rounded-2xl border border-sand-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[16px]">Subcategory photos</h2>
            <p className="mt-0.5 text-[13px] text-ink-500">
              {pending === 0 ? (
                <>All {art.total} have their own image.</>
              ) : (
                <>
                  <b className="text-navy-800">{pending}</b> of {art.total} are still
                  sharing a fallback image. Click any photo below to replace it.
                </>
              )}
            </p>
          </div>
          {pending > 0 && (
            <button
              onClick={() => setOnlyPending((v) => !v)}
              className={`min-h-[36px] shrink-0 rounded-md border px-3 text-[12.5px] font-semibold transition ${
                onlyPending
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-sand-200 text-ink-500 hover:border-gold-400"
              }`}
            >
              {onlyPending ? `Showing ${pending} pending` : "Show only pending"}
            </button>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-sand-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-navy-800 to-gold-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11.5px] text-ink-400">
          <span>{done} with bespoke art</span>
          <span>{pct}%</span>
        </div>
      </div>

      {flash && (
        <div className="sticky top-[120px] z-20 rounded-lg border border-gold-300 bg-gold-50 px-4 py-2.5 text-[13.5px] font-semibold text-[#8a6d1f]">
          {flash}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 text-[13.5px] leading-relaxed text-ink-500">
          Edits are stored as an overlay. The originals in{" "}
          <code className="rounded bg-sand-100 px-1 py-0.5 text-[12.5px]">content/categories.json</code>{" "}
          are never modified, so <b>Revert</b> always restores them exactly.
        </p>
        <button onClick={() => setShowHistory((v) => !v)}
          className="min-h-[36px] rounded-md border border-sand-200 px-3 text-[13px] font-semibold text-ink-500 hover:border-gold-400">
          {showHistory ? "Hide" : "Show"} change log
        </button>
      </div>

      {showHistory && (
        <div className="max-h-[260px] overflow-y-auto rounded-xl border border-sand-200 bg-white p-4">
          {history.length === 0 ? (
            <p className="text-[13px] text-ink-400">No changes recorded yet.</p>
          ) : (
            <ul className="grid gap-2">
              {history.map((e) => (
                <li key={e.id} className="grid grid-cols-[110px_1fr] gap-3 border-b border-sand-100 pb-2 text-[12.5px] last:border-0">
                  <span className="text-ink-400">
                    {new Date(e.at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>
                    <b className="text-navy-800">{e.key}</b>
                    <span className="text-ink-400"> · {e.field}</span>
                    <div className="truncate text-ink-500">
                      {e.old_v ? <span className="line-through opacity-60">{e.old_v}</span> : <em className="opacity-60">empty</em>}
                      {" → "}
                      <b className="text-navy-800">{e.new_v || "default"}</b>
                    </div>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {shown.map((c) => {
        const isOpen = openCat === c.slug;
        return (
          <div key={c.slug} className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? "border-navy-600 shadow-md" : "border-sand-200"}`}>
            {/* ---- category row ---- */}
            <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
              <button onClick={() => setOpenCat(isOpen ? null : c.slug)}
                className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                <Image src={c.hero} alt="" fill sizes="56px" className="object-cover" />
              </button>

              <button onClick={() => setOpenCat(isOpen ? null : c.slug)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-navy-800">{c.title}</span>
                  {c.edited && <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#8a6d1f]">edited</span>}
                  {!c.published && <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-400">hidden</span>}
                </div>
                <div className="text-[12.5px] text-ink-400">
                  /{c.slug} · {c.subcategories.length} subcategories
                  {c.subcategories.filter((s) => s.needsArt).length > 0 && (
                    <span className="ml-1.5 font-semibold text-[#8a6d1f]">
                      · {c.subcategories.filter((s) => s.needsArt).length} need photos
                    </span>
                  )}
                </div>
              </button>

              <button onClick={() => setPicker({ cat: c.slug })}
                className="min-h-[36px] shrink-0 rounded-md bg-navy-800 px-3 text-[12.5px] font-semibold text-white hover:bg-navy-700">
                Change photo
              </button>
              <button onClick={() => save("category", c.slug, undefined, { published: !c.published })}
                className="min-h-[36px] shrink-0 rounded-md border border-sand-200 px-3 text-[12.5px] font-semibold text-ink-500 hover:border-navy-600">
                {c.published ? "Hide" : "Show"}
              </button>
              <svg viewBox="0 0 24 24" onClick={() => setOpenCat(isOpen ? null : c.slug)}
                className={`size-4 shrink-0 cursor-pointer text-ink-400 transition ${isOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            {isOpen && (
              <div className="border-t border-sand-100 bg-sand-50 p-3 sm:p-4">
                {/* category fields */}
                <div className="mb-4 grid gap-3 rounded-xl border border-sand-200 bg-white p-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1 block text-[12px] font-semibold text-navy-800">Display title</span>
                    <input className={field} defaultValue={c.title}
                      onBlur={(e) => e.target.value !== c.title && save("category", c.slug, undefined, { title: e.target.value })} />
                  </label>
                  <label>
                    <span className="mb-1 block text-[12px] font-semibold text-navy-800">Card summary</span>
                    <input className={field} defaultValue={c.summary}
                      onBlur={(e) => e.target.value !== c.summary && save("category", c.slug, undefined, { summary: e.target.value })} />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-[12px] font-semibold text-navy-800">Hero image alt text</span>
                    <input className={field} defaultValue={c.heroAlt}
                      onBlur={(e) => e.target.value !== c.heroAlt && save("category", c.slug, undefined, { heroAlt: e.target.value })} />
                  </label>
                  {c.edited && (
                    <div className="sm:col-span-2">
                      <button onClick={() => reset("category", c.slug)}
                        className="text-[12.5px] font-semibold text-[#a6431f] underline underline-offset-2">
                        Revert this category to the original
                      </button>
                    </div>
                  )}
                </div>

                {/* subcategories */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {c.subcategories.map((s) => (
                    <div key={s.slug}
                      className={`flex gap-3 rounded-xl border bg-white p-2.5 ${
                        !s.published
                          ? "border-dashed border-sand-200 opacity-60"
                          : s.needsArt
                            ? "border-gold-300 bg-gold-50/40"
                            : "border-sand-200"
                      }`}>
                      <button onClick={() => setPicker({ cat: c.slug, sub: s.slug })}
                        className="group relative size-[72px] shrink-0 overflow-hidden rounded-lg bg-sand-100">
                        <Image src={s.image} alt="" fill sizes="72px" className="object-cover" />
                        <span className="absolute inset-0 grid place-items-center bg-navy-900/0 opacity-0 transition group-hover:bg-navy-900/55 group-hover:opacity-100">
                          <span className="text-[10.5px] font-bold text-gold-300">Change</span>
                        </span>
                        {s.needsArt && (
                          <span
                            title="Sharing a fallback image"
                            className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-gold-500 text-[9px] font-bold text-navy-900"
                          >
                            !
                          </span>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <input
                          className="mb-1 w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[13.5px] font-semibold text-navy-800 hover:border-sand-200 focus:border-navy-600 focus:outline-none"
                          defaultValue={s.title}
                          onBlur={(e) => e.target.value !== s.title && save("subcategory", c.slug, s.slug, { title: e.target.value })}
                        />
                        <textarea
                          className="w-full resize-none rounded border border-transparent bg-transparent px-1 py-0.5 text-[12px] leading-snug text-ink-500 hover:border-sand-200 focus:border-navy-600 focus:outline-none"
                          rows={2}
                          defaultValue={s.blurb}
                          onBlur={(e) => e.target.value !== s.blurb && save("subcategory", c.slug, s.slug, { blurb: e.target.value })}
                        />
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                          {s.needsArt && <span className="rounded-full bg-gold-500 px-1.5 py-0.5 font-bold uppercase text-navy-900">needs photo</span>}
                          {s.edited && <span className="rounded-full bg-gold-50 px-1.5 py-0.5 font-bold uppercase text-[#8a6d1f]">edited</span>}
                          {saving === `${c.slug}/${s.slug}` && <span className="text-ink-400">saving…</span>}
                          <button onClick={() => save("subcategory", c.slug, s.slug, { published: !s.published })}
                            className="font-semibold text-ink-400 underline underline-offset-2 hover:text-navy-800">
                            {s.published ? "Hide" : "Show"}
                          </button>
                          {s.edited && (
                            <button onClick={() => reset("subcategory", c.slug, s.slug)}
                              className="font-semibold text-[#a6431f] underline underline-offset-2">
                              Revert
                            </button>
                          )}
                          <a href={`/what-we-make/${c.slug}/${s.slug}`} target="_blank" rel="noreferrer"
                            className="ml-auto font-semibold text-navy-800 underline underline-offset-2">
                            View →
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <MediaPicker
        open={!!picker}
        onClose={() => setPicker(null)}
        onPick={pick}
        folder={picker?.sub ? "subcategories" : "categories"}
        title={picker?.sub ? "Choose a subcategory photo" : "Choose a category hero photo"}
      />
    </div>
  );
}
