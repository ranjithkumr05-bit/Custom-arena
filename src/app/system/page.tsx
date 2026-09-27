import type { Metadata } from "next";
import Link from "next/link";
import { Sk, SkCard, SkRows, SkText } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { Notice, Wrap } from "@/components/ui";

export const metadata: Metadata = {
  title: "System states",
  robots: { index: false, follow: false },
};

/**
 * Internal reference showing every system state in one place, so they can be
 * reviewed without having to break the site to see them.
 */
const STATES = [
  { n: 1, code: "—",   name: "Loading",       when: "Route is fetching or rendering", how: "Content-aware skeleton, per route", href: null },
  { n: 2, code: "—",   name: "Empty",         when: "Request succeeded, no data", how: "Explains why, offers next action", href: null },
  { n: 3, code: "404", name: "Not found",     when: "Route does not exist", how: "Search tip + three routes onward", href: "/this-page-does-not-exist" },
  { n: 4, code: "500", name: "Server error",  when: "Render or data fetch threw", how: "Retry without reload, digest to quote", href: null },
  { n: 5, code: "500", name: "Global error",  when: "Root layout itself crashed", how: "Self-contained, zero imports", href: null },
  { n: 6, code: "503", name: "Maintenance",   when: "Planned downtime", how: "503 + Retry-After so SEO survives", href: "/maintenance" },
  { n: 7, code: "—",   name: "Offline",       when: "Network unreachable", how: "Banner, not takeover — page stays readable", href: null },
  { n: 8, code: "429", name: "Rate limited",  when: "Too many requests", how: "Says it clears by itself", href: "/too-many-requests" },
  { n: 9, code: "403", name: "Forbidden",     when: "Authenticated but not permitted", how: "Points at the portal sign-in", href: "/forbidden" },
];

export default function SystemPage() {
  return (
    <section className="py-14">
      <Wrap>
        <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-500">
          Internal reference
        </p>
        <h1 className="mb-3 text-[clamp(28px,4vw,40px)]">The nine system states</h1>
        <p className="mb-8 max-w-[680px] text-[16.5px] leading-relaxed text-ink-500">
          There is no formal standard for these — no ISO, no RFC. What exists is
          a well-established convention, and this is the full set. Every one is
          implemented; the linked ones can be viewed directly.
        </p>

        <div className="mb-10 -mx-6 overflow-x-auto px-6 sm:mx-0 sm:rounded-2xl sm:border sm:border-sand-200 sm:px-0">
          <table className="w-full min-w-[820px] border-collapse bg-white text-left">
            <thead className="bg-sand-50">
              <tr>
                {["#", "HTTP", "State", "When it shows", "How it behaves", ""].map((h) => (
                  <th key={h} className="border-b border-sand-200 px-4 py-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATES.map((s) => (
                <tr key={s.n} className="border-b border-sand-100 last:border-0 hover:bg-sand-50">
                  <td className="px-4 py-3 text-[13px] font-bold text-navy-800">{s.n}</td>
                  <td className="px-4 py-3 font-mono text-[12.5px] text-ink-500">{s.code}</td>
                  <td className="px-4 py-3 text-[13.5px] font-semibold text-navy-800">{s.name}</td>
                  <td className="px-4 py-3 text-[13px] text-ink-500">{s.when}</td>
                  <td className="px-4 py-3 text-[13px] text-ink-500">{s.how}</td>
                  <td className="px-4 py-3">
                    {s.href ? (
                      <Link href={s.href} className="whitespace-nowrap text-[12.5px] font-semibold text-navy-800 underline decoration-gold-500 underline-offset-4">
                        View →
                      </Link>
                    ) : (
                      <span className="text-[12px] text-ink-400">below</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mb-4 text-[20px]">1 · Loading skeletons</h2>
        <p className="mb-4 max-w-[680px] text-[14.5px] leading-relaxed text-ink-500">
          Content-aware, not spinners. A spinner says &ldquo;something is
          happening&rdquo;; a skeleton says what is arriving and how much of it,
          which lowers perceived wait and stops the layout jumping. Static grey
          under <code>prefers-reduced-motion</code>.
        </p>
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkCard /><SkCard /><SkCard /><SkCard />
        </div>
        <div className="mb-4"><SkRows n={3} /></div>
        <div className="mb-10 max-w-[560px] rounded-xl border border-sand-200 bg-white p-5">
          <Sk className="mb-3 h-6 w-1/2" />
          <SkText lines={4} />
        </div>

        <h2 className="mb-4 text-[20px]">2 · Empty states</h2>
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <EmptyState
            title="No enquiries yet"
            body="Nothing is recorded against this number. Build a quote and it will appear here."
            action={{ href: "/quote", label: "Build a quote" }}
          />
          <EmptyState
            title="No matches"
            body="Nothing matched that filter. Try a broader term, or browse the full catalogue."
            action={{ href: "/what-we-make", label: "Browse categories" }}
          />
        </div>

        <h2 className="mb-4 text-[20px]">7 · Offline</h2>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3 rounded-xl bg-[#a6431f] px-4 py-2.5 text-center text-[13.5px] font-medium text-white">
          <span>You are offline. This page is still readable, but forms will not send.</span>
          <span className="rounded border border-white/40 px-2.5 py-0.5 text-[12.5px] font-semibold">Retry</span>
        </div>
        <Notice>
          <strong>A banner, not a full-page takeover.</strong> The page they are
          already on is rendered and still useful — replacing it would remove
          working content in order to announce that something is broken.
          <code>navigator.onLine</code> alone is unreliable (it reports true on
          a router with no internet behind it), so a same-origin HEAD confirms
          reachability first.
        </Notice>
      </Wrap>
    </section>
  );
}
