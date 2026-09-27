import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Btn, Eyebrow, Jsonld, Notice, Tag, Wrap } from "@/components/ui";
import NextStep from "@/components/NextStep";
import PageHero from "@/components/PageHero";
import StyleOptions from "@/components/StyleOptions";
import SampleCta from "@/components/SampleCta";
import { SITE, getDecoration, getFabric } from "@/lib/content";
import { publicCatalog, publicCategory } from "@/lib/catalog";
import { BackBarUI } from "@/components/BackBar";

export function generateStaticParams() {
  return publicCatalog().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = publicCategory(slug);
  if (!c) return {};
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: { canonical: `/what-we-make/${c.slug}` },
    openGraph: { title: c.seoTitle, description: c.seoDescription, images: [c.hero] },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = publicCategory(slug);
  if (!c) notFound();
  const CATEGORIES = publicCatalog();

  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "What We Make", item: `${SITE.url}/what-we-make` },
      { "@type": "ListItem", position: 3, name: c.title },
    ],
  };

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.title,
    numberOfItems: c.subcategories.length,
    itemListElement: c.subcategories.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.title,
      url: `${SITE.url}/what-we-make/${c.slug}/${s.slug}`,
    })),
  };

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: c.title,
    provider: { "@type": "Organization", name: SITE.name },
    areaServed: { "@type": "Country", name: "India" },
    description: c.seoDescription,
  };

  return (
    <>
      <Jsonld data={crumbs} />
      <Jsonld data={listLd} />
      <Jsonld data={serviceLd} />

      <BackBarUI href="/what-we-make" label="What We Make" here={c.title} />

      <PageHero
        banner={c.hero}
        eyebrow="What we make"
        title={c.heading}
        lead={c.intro}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/what-we-make", label: "What We Make" },
          { label: c.title },
        ]}
      />

      {/* ---------- subcategories ---------- */}
      <section className="py-14 lg:py-16">
        <Wrap>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Choose what you need</Eyebrow>
              <h2 className="text-[clamp(24px,3.2vw,32px)]">
                {c.subcategories.length} types in this category
              </h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Tag gold>MOQ {SITE.business.moq} pieces</Tag>
              {c.constructions.map((f) => (
                <Tag key={f}>{getFabric(f)?.name ?? f}</Tag>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.subcategories.map((s) => (
              <Link
                key={s.slug}
                href={`/what-we-make/${c.slug}/${s.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-sand-100">
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-navy-900/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="flex flex-1 flex-col p-[18px]">
                  <h3 className="mb-1.5 text-[16px]">{s.title}</h3>
                  <p className="mb-3.5 flex-1 text-[13.5px] leading-relaxed text-ink-500">
                    {s.blurb}
                  </p>
                  <span className="flex items-center justify-between border-t border-sand-100 pt-3 text-[13.5px] font-semibold text-navy-800">
                    <span className="transition-colors group-hover:text-gold-500">See details</span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sand-50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-gold-500 group-hover:text-navy-900">
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14m-6-6 6 6-6 6" />
                      </svg>
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ---------- styles ---------- */}
      <StyleOptions />

      {/* ---------- detail ---------- */}
      <section className="border-t border-sand-200 py-14">
        <Wrap className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Eyebrow>Worth knowing</Eyebrow>
            <h2 className="mb-5 text-[26px]">Before you order</h2>
            <ul className="mb-8 grid gap-3">
              {c.considerations.map((x) => (
                <li key={x} className="border-l-2 border-gold-500 pl-4 text-[15px] leading-relaxed text-ink-500">
                  {x}
                </li>
              ))}
            </ul>

            {"notMade" in c && c.notMade && (
              <Notice>
                <strong>What we do not make in this category.</strong> {c.notMade}
              </Notice>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-sand-200 bg-sand-50 p-6">
              <h3 className="mb-3 text-[16px]">Who buys this</h3>
              <ul className="grid gap-2">
                {c.buyers.map((b) => (
                  <li key={b} className="text-[14px] text-ink-500">{b}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-sand-200 bg-sand-50 p-6">
              <h3 className="mb-3 text-[16px]">Branding options</h3>
              <ul className="grid gap-3">
                {c.decoration.map((d) => {
                  const dec = getDecoration(d);
                  return (
                    <li key={d}>
                      <div className="text-[14px] font-semibold text-navy-800">{dec?.name ?? d}</div>
                      <div className="text-[13px] text-ink-500">{dec?.bestFor}</div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <SampleCta product={c.slug} />

            <div className="rounded-2xl bg-navy-800 p-6 text-[#c9d4e4]">
              <h3 className="mb-2 text-[16px] text-white">Ready for a rate?</h3>
              <p className="mb-4 text-[14px] leading-relaxed text-[#9fb0c7]">
                Enter your size breakdown and get an indicative range instantly.
              </p>
              <Btn href={`/quote?product=${c.slug}`} variant="gold" className="w-full">
                Open quote builder
              </Btn>
            </div>
          </aside>
        </Wrap>
      </section>

      {/* ---------- other categories ---------- */}
      <section className="border-t border-sand-200 bg-sand-50 py-12">
        <Wrap>
          <h2 className="mb-5 text-[20px]">Other categories</h2>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.filter((x) => x.slug !== c.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/what-we-make/${x.slug}`}
                className="inline-flex min-h-[44px] items-center rounded-full border border-sand-200 bg-white px-4 text-[14px] font-medium text-navy-800 transition hover:border-gold-400"
              >
                {x.title}
              </Link>
            ))}
          </div>
        </Wrap>
      </section>

      <NextStep
        title={`Get a rate for ${c.title.toLowerCase()}`}
        body="Tell us the type, quantity and size breakdown. You will see an indicative range before you send anything."
        primary={{ href: `/quote?product=${c.slug}`, label: "Build a quote" }}
        secondary={{ href: "/fabrics", label: "Compare fabrics" }}
      />
    </>
  );
}
