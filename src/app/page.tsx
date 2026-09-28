import Image from "next/image";
import Link from "next/link";
import Faq from "@/components/Faq";
import Reveal from "@/components/Reveal";
import HeroRotator from "@/components/HeroRotator";
import { Stitch, PROCESS_ICONS, METHOD_ICONS } from "@/components/icons";
import StartHere from "@/components/StartHere";
import TrustStrip from "@/components/TrustStrip";
import HowItWorks from "@/components/HowItWorks";
import NextStep from "@/components/NextStep";
import { Btn, Eyebrow, Jsonld, SectionHead, Tag, Wrap } from "@/components/ui";
import { DECORATION, PROCESS, SITE, publishableFaqs } from "@/lib/content";
import { publicCatalog } from "@/lib/catalog";

/**
 * 20px blur placeholder for the hero backdrop — produced by
 * `scripts/hero-fabric.mjs` and inlined so the first paint is textured navy
 * rather than flat #050f1e.
 */
const HERO_FABRIC_LQIP =
  "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAAAQBACdASoUAAsAPu1iqU2ppaQiMAgBMB2JZwCw7CK5pwOzNDZMxu/YAAD+8rHG5hhwAzDoZdShi7tkgZR3JBVbGJMpuyNnlutAAA==";

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: publishableFaqs().map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Home() {
  const CATEGORIES = publicCatalog();
  return (
    <>
      <Jsonld data={faqLd} />

      {/* ================= HERO ================= */}
      {/* Editorial split rather than the usual full-bleed photo at 35%
          opacity with text laid over it. Type owns the left, product owns
          the right.
          The backdrop is the unit's own knit rather than a stock factory
          floor. It is laid down twice: once for the yarn structure, once
          screened, so only the threads catching light and the gold bokeh
          rise out of the navy. Dark stays dark; the fabric reads as light
          rather than as wallpaper. */}
      <section className="relative isolate overflow-hidden bg-[#050f1e] text-white">
        <Image
          src="/banners/hero-fabric.webp" alt="" fill priority sizes="100vw"
          placeholder="blur" blurDataURL={HERO_FABRIC_LQIP}
          className="pointer-events-none object-cover object-[62%_38%] opacity-40"
        />
        <Image
          src="/banners/hero-fabric.webp" alt="" fill sizes="100vw"
          className="pointer-events-none object-cover object-[62%_38%] opacity-55 mix-blend-screen"
        />
        {/* depth from layered light, not from wallpaper */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_15%_-10%,#123055_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_500px_at_95%_110%,rgba(200,162,74,.13)_0%,transparent_58%)]" />
        {/* The headline sits on a photograph now, so readability is a
            measurement, not a hope: the copy side is darkened harder than
            the product side, and the foot fades into the next section.
            scripts/hero-contrast.mjs checks the result against WCAG AA. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,15,30,.82)_0%,rgba(5,15,30,.42)_46%,rgba(5,15,30,.24)_100%)] md:bg-[linear-gradient(97deg,rgba(5,15,30,.92)_0%,rgba(5,15,30,.68)_40%,rgba(5,15,30,.26)_68%,rgba(5,15,30,.12)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgba(5,15,30,.85)_100%)]" />

        <Wrap className="relative grid items-center gap-10 py-10 sm:py-14 md:grid-cols-[1.05fr_.95fr] md:gap-10 md:py-16 lg:gap-16 lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-gold-400 sm:mb-5 sm:gap-2.5 sm:px-3.5 sm:text-[11.5px] sm:tracking-[0.13em]">
              <Stitch size={14} />
              <span className="sm:hidden">Knitwear · Tiruppur</span>
              <span className="hidden sm:inline">Knitwear manufacturing · Tiruppur</span>
            </p>

            <h1 className="mb-5 text-[clamp(30px,7.4vw,68px)] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:mb-6">
              We make{" "}
              <br />
              the garment.{" "}
              <br />
              <span className="relative inline-block text-gold-400">
                You deal direct.
                <svg aria-hidden viewBox="0 0 300 12" className="absolute -bottom-1 left-0 w-full text-gold-500/45"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M3 8c48-5 96-6 147-4s99 3 147-1" />
                </svg>
              </span>
            </h1>

            <p className="mb-7 max-w-[520px] text-[15.5px] leading-[1.6] text-[#a9bad1] sm:mb-9 sm:text-[clamp(16px,1.8vw,18.5px)]">
              Corporate wear, sportswear, campus apparel, workwear and private
              label — produced in our own unit in Tiruppur. Fabric to dispatch,
              nothing sent outside. Orders start at {SITE.business.moq} pieces.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Btn href="/quote" variant="gold" size="lg">Get a quote</Btn>
              <Btn href="/what-we-make" variant="light" size="lg">See what we make</Btn>
            </div>
          </div>

          <HeroRotator
            items={CATEGORIES.map((c) => ({
              slug: c.slug, title: c.title, hero: c.hero,
              heroAlt: c.heroAlt, count: c.subcategories.length,
            }))}
          />
        </Wrap>
      </section>

      <TrustStrip />

      <StartHere />

      {/* ================= CATEGORIES ================= */}
      <section className="py-20 lg:py-24">
        <Wrap>
          <SectionHead
            eyebrow="What we make"
            title="What are you buying for?"
            lead="Find yourself below. Not sure which fabric or how it should be printed? That is our job — just tell us what it is for."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 4) * 70}>
              <Link
                href={`/what-we-make/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
                  <Image
                    src={c.hero} alt={c.heroAlt} width={600} height={450}
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-navy-900/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="flex flex-1 flex-col p-[18px]">
                  <h3 className="mb-1.5 text-[16.5px]">{c.title}</h3>
                  <p className="mb-3.5 flex-1 text-[13.5px] leading-relaxed text-ink-500">{c.summary}</p>
                  <div className="mb-3.5 flex flex-wrap gap-1.5">
                    <Tag>{c.subcategories.length} types</Tag>
                    <Tag gold>MOQ {SITE.business.moq}</Tag>
                  </div>
                  {/* Explicit affordance. The card was clickable but nothing
                      said so — a chip and a title read as a label, not a door. */}
                  <span className="flex items-center justify-between border-t border-sand-100 pt-3 text-[13.5px] font-semibold text-navy-800">
                    <span className="transition-colors group-hover:text-gold-500">
                      View {c.subcategories.length} types
                    </span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sand-50 text-navy-800 transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-gold-500 group-hover:text-navy-900">
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14m-6-6 6 6-6 6" />
                      </svg>
                    </span>
                  </span>
                </div>
              </Link>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ================= POSITIONING ================= */}
      <section className="bg-navy-800 py-20 text-[#c9d4e4] lg:py-24">
        <Wrap>
          <SectionHead
            dark
            eyebrow="Why buy direct"
            title="Most Tiruppur orders pass through someone who never touches the garment"
            lead="An agent takes your order, hands it to a unit like ours, and adds a margin for doing so. You pay it. We don't see it. Buying direct removes that layer entirely."
          />
          <div className="grid gap-7 lg:grid-cols-3">
            {[
              ["No trading margin", "You're quoted by the unit that makes the goods. No intermediary adds a percentage between you and production."],
              ["Nothing outsourced", "Cutting, printing, embroidery, sublimation, stitching, checking and packing all happen here. No waiting on another vendor's queue."],
              ["Talk to production", "Questions about GSM, shrinkage or colour matching are answered by the people on the floor, not relayed through a middleman."],
            ].map(([h, p], i) => (
              <Reveal key={h} delay={i * 90} className="border-l-2 border-gold-500 pl-5">
                <h3 className="mb-2 text-[18px] text-white">{h}</h3>
                <p className="text-[14.5px] leading-relaxed text-[#9fb0c7]">{p}</p>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ================= PROCESS ================= */}
      <section className="bg-sand-50 py-20 lg:py-24">
        <Wrap>
          <SectionHead
            eyebrow="In-house process"
            title="What happens after you order"
            lead="Every stage happens inside our unit — including all five branding methods. That's what lets us take a 10-piece order without treating it as an inconvenience."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROCESS.map((s, i) => (
              <Reveal key={s.slug} delay={(i % 3) * 60} className="rounded-xl border border-sand-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 text-gold-400">
                    {(() => { const Ico = PROCESS_ICONS[s.slug]; return Ico ? <Ico size={21} /> : null; })()}
                  </span>
                  <b className="text-[12px] font-bold tracking-wide text-ink-400">{s.n}</b>
                </div>
                <h4 className="mb-1.5 text-[15px]">
                  {s.title}
                  {"branch" in s && s.branch && (
                    <span className="ml-1.5 rounded-full bg-gold-50 px-1.5 py-0.5 align-middle text-[9.5px] font-bold uppercase tracking-wide text-[#8a6d1f]">
                      choose 1 of 5
                    </span>
                  )}
                </h4>
                <p className="text-[13px] leading-relaxed text-ink-500">{s.short}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-8">
            <Btn href="/process" variant="ghost">How each stage works →</Btn>
          </div>
        </Wrap>
      </section>

      {/* ================= DECORATION ================= */}
      <section className="py-20 lg:py-24">
        <Wrap>
          <SectionHead
            eyebrow="Branding methods"
            title="Five ways to put your mark on it"
            lead="Most buyers aren't sure which method suits their artwork. Here's the honest version — we recommend based on design, quantity and fabric."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {DECORATION.map((d, i) => (
              <Reveal key={d.slug} delay={i * 60} className="rounded-xl border border-sand-200 bg-white p-5">
                <span className="mb-3 grid size-10 place-items-center rounded-xl bg-sand-50 text-navy-800">
                  {(() => { const Ico = METHOD_ICONS[d.slug]; return Ico ? <Ico size={21} /> : null; })()}
                </span>
                <h4 className="mb-1.5 text-[15px]">{d.name}</h4>
                <p className="mb-2.5 text-[13px] leading-relaxed text-ink-500">{d.how}</p>
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-gold-500">
                  {d.goodQty}
                </div>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>

      {/* Shows the four methods as fabric detail — a buyer can see the
          difference between a flat print and raised thread far faster than
          they can read it. */}
      <section className="relative h-[190px] overflow-hidden sm:h-[250px] lg:h-[310px]">
        <Image src="/banners/banner-branding.jpg" alt="Close-up of screen print, embroidery, transfer print and sublimation on navy knit" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,15,30,.7),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0">
          <Wrap className="pb-5">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-gold-400">
              Screen · embroidery · transfer · sublimation
            </p>
          </Wrap>
        </div>
      </section>

      <HowItWorks />

      {/* ================= FAQ ================= */}
      <section className="py-20 lg:py-24">
        <Wrap>
          <SectionHead eyebrow="Common questions" title="Answers before you ask" />
          <Faq items={publishableFaqs().slice(0, 6)} />
          <div className="mt-8">
            <Btn href="/guides" variant="ghost">Read the guides →</Btn>
            <Btn href="/glossary" variant="ghost" className="ml-2.5">Glossary · 58 terms</Btn>
          </div>
        </Wrap>
      </section>

      <NextStep
        title="Send us your requirement"
        body="Size breakdown, artwork, or just a rough idea. We'll tell you what's possible, what it costs, and when you could have it."
        primary={{ href: "/quote", label: "Get a quote" }}
        secondary={{ href: "/what-we-make", label: "See what we make" }}
      />
    </>
  );
}
