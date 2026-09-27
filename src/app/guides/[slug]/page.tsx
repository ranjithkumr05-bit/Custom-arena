import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Faq from "@/components/Faq";
import { Btn, Jsonld, Wrap } from "@/components/ui";
import { GUIDES, SITE, getGuide } from "@/lib/content";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.excerpt,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.excerpt },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  /* AEO: the page leads with a direct question and a short, quotable answer,
     and exposes both Article and FAQPage structured data. */
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.excerpt,
    datePublished: g.updated,
    dateModified: g.updated,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: `${SITE.url}/guides/${g.slug}`,
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: g.question, acceptedAnswer: { "@type": "Answer", text: g.answer } },
      ...g.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    ],
  };

  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE.url}/guides` },
      { "@type": "ListItem", position: 3, name: g.title },
    ],
  };

  return (
    <>
      <Jsonld data={articleLd} />
      <Jsonld data={faqLd} />
      <Jsonld data={crumbs} />

      <article className="py-14 lg:py-16">
        <Wrap className="max-w-[820px]">
          <nav className="mb-5 hidden text-[13px] text-ink-400 sm:block">
            <Link href="/" className="hover:text-navy-800">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/guides" className="hover:text-navy-800">Guides</Link>
          </nav>

          <h1 className="mb-4 text-[clamp(28px,4.2vw,42px)]">{g.title}</h1>
          <p className="mb-8 text-[18px] leading-relaxed text-ink-500">{g.excerpt}</p>

          {/* The quotable answer block — what an answer engine lifts. */}
          <div className="mb-10 rounded-2xl border border-gold-300 bg-gold-50 p-6">
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.1em] text-[#8a6d1f]">
              {g.question}
            </div>
            <p className="text-[16.5px] leading-relaxed text-navy-800">{g.answer}</p>
          </div>

          <div className="space-y-8">
            {g.sections.map((s) => (
              <section key={s.h}>
                <h2 className="mb-2.5 text-[22px]">{s.h}</h2>
                <p className="text-[16px] leading-[1.75] text-ink-700">{s.p}</p>
              </section>
            ))}
          </div>

          <div className="mt-14">
            <h2 className="mb-4 text-[24px]">Related questions</h2>
            <Faq items={g.faq} />
          </div>

          <div className="mt-12 rounded-2xl bg-navy-800 p-7 text-[#c9d4e4]">
            <h3 className="mb-2 text-[20px] text-white">Still deciding?</h3>
            <p className="mb-5 text-[15px] leading-relaxed text-[#9fb0c7]">
              Send us the artwork and quantity. We&apos;ll tell you which fabric
              and branding method actually suits it — including when the answer
              is the cheaper one.
            </p>
            <div className="flex flex-wrap gap-3">
              <Btn href="/quote" variant="gold">Get a quote</Btn>
              <Btn href="/guides" variant="light">More guides</Btn>
            </div>
          </div>

          <div className="mt-10 border-t border-sand-200 pt-6">
            <h3 className="mb-3.5 text-[16px]">Other guides</h3>
            <div className="flex flex-wrap gap-2.5">
              {GUIDES.filter((x) => x.slug !== g.slug).map((x) => (
                <Link
                  key={x.slug}
                  href={`/guides/${x.slug}`}
                  className="rounded-full border border-sand-200 px-4 py-2 text-[13.5px] font-medium text-navy-800 transition hover:border-gold-400"
                >
                  {x.title}
                </Link>
              ))}
            </div>
          </div>
        </Wrap>
      </article>
    </>
  );
}
