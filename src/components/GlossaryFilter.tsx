"use client";

import { useMemo, useState } from "react";
import type { Term } from "@/lib/glossary";

export default function GlossaryFilter({
  terms,
  groups,
}: {
  terms: Term[];
  groups: string[];
}) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return terms.filter((t) => {
      if (group !== "All" && t.group !== group) return false;
      if (!needle) return true;
      return (t.term + " " + t.def + " " + (t.also ?? "")).toLowerCase().includes(needle);
    });
  }, [terms, q, group]);

  const byGroup = useMemo(() => {
    const m = new Map<string, Term[]>();
    for (const t of shown) {
      if (!m.has(t.group)) m.set(t.group, []);
      m.get(t.group)!.push(t);
    }
    for (const list of m.values()) list.sort((a, b) => a.term.localeCompare(b.term));
    return m;
  }, [shown]);

  return (
    <>
      <div className="sticky top-[124px] z-30 -mx-6 mb-9 border-b border-sand-200 bg-white/94 px-6 py-3.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search terms…"
            aria-label="Search glossary"
            className="min-h-[42px] min-w-[200px] flex-1 rounded-md border border-sand-200 px-3.5 text-[14.5px] focus:border-navy-600 focus:outline-none focus:ring-[3px] focus:ring-navy-600/12"
          />
          <div className="flex flex-wrap gap-1.5">
            {["All", ...groups].map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`min-h-[36px] rounded-full border px-3.5 text-[13px] font-semibold transition ${
                  group === g
                    ? "border-navy-800 bg-navy-800 text-white"
                    : "border-sand-200 bg-white text-ink-500 hover:border-gold-400"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 text-[12.5px] text-ink-400">
          Showing {shown.length} of {terms.length} terms
        </div>
      </div>

      {shown.length === 0 && (
        <p className="rounded-xl border border-sand-200 bg-sand-50 px-6 py-10 text-center text-[15px] text-ink-500">
          No terms match “{q}”.
        </p>
      )}

      <div className="space-y-12">
        {groups
          .filter((g) => byGroup.has(g))
          .map((g) => (
            <section key={g}>
              <h2 className="mb-4 border-b border-sand-200 pb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-gold-500">
                {g}
              </h2>
              <dl className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
                {byGroup.get(g)!.map((t) => (
                  <div key={t.slug} id={t.slug} className="scroll-mt-40">
                    <dt className="mb-1 text-[15.5px] font-semibold text-navy-800">
                      {t.term}
                      {t.also && (
                        <span className="ml-2 text-[12.5px] font-normal text-ink-400">
                          also: {t.also}
                        </span>
                      )}
                    </dt>
                    <dd className="text-[14.5px] leading-relaxed text-ink-500">{t.def}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
      </div>
    </>
  );
}
