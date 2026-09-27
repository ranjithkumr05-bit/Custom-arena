import type { Metadata } from "next";
import Link from "next/link";
import { Jsonld, Wrap } from "@/components/ui";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import { GUIDES, SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Guides — GSM, Printing Methods, Size Breakdowns & MOQ",
  description:
    "Practical guides to specifying a knitwear order: GSM explained, printing methods compared, how to plan a size breakdown, and why per-piece rates change with quantity.",
};

const ld = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Apparel manufacturing guides",
  url: `${SITE.url}/guides`,
  hasPart: GUIDES.map((g) => ({
    "@type": "Article",
    headline: g.title,
    url: `${SITE.url}/guides/${g.slug}`,
    datePublished: g.updated,
  })),
};

export default function GuidesIndex() {
  return (
    <>
      <Jsonld data={ld} />
      <PageHero
        banner="/banners/banner-editorial.jpg"
        eyebrow="Guides"
        title="How to specify an apparel order properly"
        lead="Written for buyers, not for search engines. These are the questions we answer on the phone most often — GSM, printing methods, size curves and why small runs cost more per piece."
        crumbs={[{ href: "/", label: "Home" }, { label: "Guides" }]}
      />
      <section className="py-14 lg:py-16">
        <Wrap>

          <div className="grid gap-5 md:grid-cols-2">
            {GUIDES.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group flex flex-col rounded-2xl border border-sand-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-lg"
              >
                <div className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.1em] text-gold-500">
                  Guide
                </div>
                <h2 className="mb-2.5 text-[20px] leading-snug">{g.title}</h2>
                <p className="mb-4 flex-1 text-[14.5px] leading-relaxed text-ink-500">
                  {g.excerpt}
                </p>
                <div className="rounded-lg bg-sand-50 p-3.5">
                  <div className="mb-1 text-[12px] font-semibold text-navy-800">
                    {g.question}
                  </div>
                  <div className="line-clamp-3 text-[13px] leading-relaxed text-ink-500">
                    {g.answer}
                  </div>
                </div>
                <span className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-navy-800 transition-colors group-hover:text-gold-500">
                  Read the guide
                  <span className="grid size-6 place-items-center rounded-full bg-sand-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-gold-500 group-hover:text-navy-900">
                    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-sand-200 bg-sand-50 p-6">
            <h2 className="mb-1.5 text-[18px]">Looking for a specific term?</h2>
            <p className="mb-4 text-[14.5px] text-ink-500">
              The glossary defines 58 apparel manufacturing terms in plain English.
            </p>
            <a href="/glossary" className="inline-flex min-h-[44px] items-center rounded-md bg-navy-800 px-5 text-[14.5px] font-semibold text-white">
              Open the glossary
            </a>
          </div>
        </Wrap>
      </section>

      <NextStep
        title="Ready to put it into practice?"
        body="The quote builder walks you through product, fabric, branding and size breakdown one step at a time."
        primary={{ href: "/quote", label: "Build a quote" }}
        secondary={{ href: "/glossary", label: "Glossary" }}
      />
    </>
  );
}
