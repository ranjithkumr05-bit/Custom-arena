import Link from "next/link";
import { waHref } from "@/lib/content";
import { Wrap } from "./ui";
import { SizeGrid, Swatch, TalkToUs } from "./icons";

/**
 * The first decision a visitor makes.
 *
 * Most B2B manufacturing sites drop you on a wall of capability copy and let
 * you work out your own route. This forks the three real intents — ready to
 * order, still comparing, or just want a person — and names the time cost of
 * each so nobody has to guess what clicking will commit them to.
 */

const PATHS = [
  {
    href: "/quote",
    badge: "about 2 minutes",
    title: "I know what I need",
    body: "Enter your product, colours and size breakdown. You'll see an indicative rate before you send anything.",
    cta: "Build a quote",
    tone: "gold" as const,
    Icon: SizeGrid,
  },
  {
    href: "/fabrics",
    badge: "have a look first",
    title: "I'm still deciding",
    body: "Compare knit fabrics and the five branding methods side by side, with the honest limits of each.",
    cta: "Compare options",
    tone: "plain" as const,
    Icon: Swatch,
  },
  {
    href: "wa",
    badge: "fastest reply",
    title: "I'd rather just ask",
    body: "Send the product and rough quantity on WhatsApp. We usually come back with a range the same day.",
    cta: "Message us",
    tone: "wa" as const,
    Icon: TalkToUs,
  },
];

const TONES = {
  gold: "border-gold-300 bg-gold-50 hover:border-gold-500",
  plain: "border-sand-200 bg-white hover:border-navy-600",
  wa: "border-[#b8e3c8] bg-[#f2fbf5] hover:border-[#1faa52]",
};

const CTA_TONES = {
  gold: "bg-gold-500 text-navy-900 group-hover:bg-gold-400",
  plain: "bg-navy-800 text-white group-hover:bg-navy-700",
  wa: "bg-[#1faa52] text-white group-hover:bg-[#1a9147]",
};

export default function StartHere() {
  return (
    <section className="border-b border-sand-200 bg-sand-50 py-14 lg:py-16" id="start">
      <Wrap>
        <div className="mb-8 text-center">
          <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-500">
            Start here
          </p>
          <h2 className="text-[clamp(24px,3.2vw,34px)]">Where would you like to begin?</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PATHS.map((p) => {
            const inner = (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-white text-navy-800 shadow-sm">
                    <p.Icon size={22} />
                  </span>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-ink-500">
                    {p.badge}
                  </span>
                </div>
                <h3 className="mb-2 text-[19px]">{p.title}</h3>
                <p className="mb-5 flex-1 text-[14.5px] leading-relaxed text-ink-500">{p.body}</p>
                <span className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-5 text-[14.5px] font-semibold transition ${CTA_TONES[p.tone]}`}>
                  {p.cta}
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </span>
              </>
            );

            const cls = `group flex flex-col rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${TONES[p.tone]}`;

            return p.href === "wa" ? (
              <a key={p.title} href={waHref()} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={p.title} href={p.href} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </Wrap>
    </section>
  );
}
