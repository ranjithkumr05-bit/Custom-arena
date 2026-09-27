import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Btn, Eyebrow, Jsonld, Notice, Tag, Wrap } from "@/components/ui";
import NextStep from "@/components/NextStep";
import StyleOptions from "@/components/StyleOptions";
import SampleCta from "@/components/SampleCta";
import { SITE, getDecoration, getFabric } from "@/lib/content";
import { allPublicSubs, publicSub } from "@/lib/catalog";
import { BackBarUI } from "@/components/BackBar";

export function generateStaticParams() {
  return allPublicSubs().map(({ cat, sub }) => ({
    slug: cat.slug,
    sub: sub.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; sub: string }>;
}): Promise<Metadata> {
  const { slug, sub } = await params;
  const found = publicSub(slug, sub);
  if (!found) return {};
  // "Labels & Packaging Manufacturer" reads badly, so the pattern names the
  // category rather than forcing "Manufacturer" onto every item.
  const title = `${found.sub.title} — Custom ${found.cat.nav} in Tiruppur`;
  const description = `${found.sub.blurb} Manufactured in our own unit in Tiruppur — fabric to dispatch, orders from ${SITE.business.moq} pieces.`;
  return {
    title: { absolute: `${title} | CustomWear` },
    description,
    alternates: { canonical: `/what-we-make/${slug}/${sub}` },
    openGraph: { title, description, images: [found.sub.image] },
  };
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ slug: string; sub: string }>;
}) {
  const { slug, sub } = await params;
  const found = publicSub(slug, sub);
  if (!found) notFound();
  const { cat, sub: s } = found;

  const siblings = cat.subcategories.filter((x) => x.slug !== s.slug);

  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "What We Make", item: `${SITE.url}/what-we-make` },
      { "@type": "ListItem", position: 3, name: cat.title, item: `${SITE.url}/what-we-make/${cat.slug}` },
      { "@type": "ListItem", position: 4, name: s.title },
    ],
  };

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: s.title,
    description: s.blurb,
    image: `${SITE.url}${s.image}`,
    category: cat.title,
    brand: { "@type": "Brand", name: SITE.name },
    manufacturer: { "@type": "Organization", name: SITE.name },
    material: cat.constructions.map((f) => getFabric(f)?.name ?? f).join(", "),
  };

  return (
    <>
      <Jsonld data={crumbLd} />
      <Jsonld data={productLd} />

      <BackBarUI href={`/what-we-make/${cat.slug}`} label={cat.title} here={s.title} />

      {/* ---------- hero ---------- */}
      <section className="border-b border-sand-200 bg-sand-50">
        <Wrap className="grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-14">
          <div>
            <nav className="mb-4 hidden flex-wrap items-center gap-x-1.5 text-[13px] text-ink-400 sm:flex">
              <Link href="/" className="hover:text-navy-800">Home</Link>
              <span>/</span>
              <Link href="/what-we-make" className="hover:text-navy-800">What We Make</Link>
              <span>/</span>
              <Link href={`/what-we-make/${cat.slug}`} className="hover:text-navy-800">{cat.title}</Link>
              <span>/</span>
              <span className="text-navy-800">{s.title}</span>
            </nav>

            <h1 className="mb-3.5 text-[clamp(27px,4vw,42px)]">{s.title}</h1>
            <p className="mb-5 text-[17px] leading-relaxed text-ink-500">{s.blurb}</p>

            <div className="mb-6 flex flex-wrap gap-1.5">
              <Tag gold>MOQ {SITE.business.moq} pieces</Tag>
              {cat.constructions.slice(0, 3).map((f) => (
                <Tag key={f}>{getFabric(f)?.name ?? f}</Tag>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Btn href={`/quote?product=${cat.slug}&item=${s.slug}`} variant="navy" size="lg">
                Get a quote for this
              </Btn>
              <Btn href={`/what-we-make/${cat.slug}`} variant="ghost" size="lg">
                All {cat.title.toLowerCase()}
              </Btn>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={s.image}
              alt={`${s.title} — ${s.blurb}`}
              width={1200}
              height={670}
              priority
              className="size-full object-cover"
            />
          </div>
        </Wrap>
      </section>

      {/* ---------- spec ---------- */}
      <section className="py-14">
        <Wrap className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Eyebrow>How we make it</Eyebrow>
            <h2 className="mb-4 text-[25px]">Specification</h2>
            <p className="mb-7 text-[16px] leading-[1.75] text-ink-700">{cat.intro}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-sand-200 bg-white p-5">
                <h3 className="mb-2.5 text-[14px]">Fabrics used</h3>
                <ul className="grid gap-1.5">
                  {cat.constructions.map((f) => {
                    const fab = getFabric(f);
                    return (
                      <li key={f} className="text-[13.5px] text-ink-500">
                        <b className="text-navy-800">{fab?.name ?? f}</b>
                        {fab?.plainEnglish && <> — {fab.plainEnglish}</>}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-xl border border-sand-200 bg-white p-5">
                <h3 className="mb-2.5 text-[14px]">Branding options</h3>
                <ul className="grid gap-1.5">
                  {cat.decoration.map((d) => {
                    const dec = getDecoration(d);
                    return (
                      <li key={d} className="text-[13.5px] text-ink-500">
                        <b className="text-navy-800">{dec?.name ?? d}</b>
                        {dec?.bestFor && <> — {dec.bestFor.toLowerCase()}</>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <h3 className="mb-3 mt-8 text-[18px]">Before you order</h3>
            <ul className="grid gap-2.5">
              {cat.considerations.map((x) => (
                <li key={x} className="border-l-2 border-gold-500 pl-4 text-[14.5px] leading-relaxed text-ink-500">
                  {x}
                </li>
              ))}
            </ul>

            {"notMade" in cat && cat.notMade && (
              <div className="mt-6">
                <Notice>
                  <strong>What we do not make.</strong> {cat.notMade}
                </Notice>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl bg-navy-800 p-6 text-[#c9d4e4]">
              <h3 className="mb-2 text-[17px] text-white">Quote for {s.title.toLowerCase()}</h3>
              <p className="mb-4 text-[14px] leading-relaxed text-[#9fb0c7]">
                The quote builder opens pre-set to this item. Add your size
                breakdown and you will see an indicative range straight away.
              </p>
              <Btn href={`/quote?product=${cat.slug}&item=${s.slug}`} variant="gold" className="w-full">
                Build a quote
              </Btn>
            </div>

            <SampleCta product={cat.slug} item={s.slug} />

            <div className="rounded-2xl border border-sand-200 bg-sand-50 p-6">
              <h3 className="mb-3 text-[15px]">Typical buyers</h3>
              <ul className="grid gap-2">
                {cat.buyers.map((b) => (
                  <li key={b} className="text-[14px] text-ink-500">{b}</li>
                ))}
              </ul>
            </div>
          </aside>
        </Wrap>
      </section>

      <StyleOptions />

      {/* ---------- siblings ---------- */}
      {siblings.length > 0 && (
        <section className="py-14">
          <Wrap>
            <h2 className="mb-6 text-[22px]">More in {cat.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {siblings.slice(0, 8).map((x) => (
                <Link
                  key={x.slug}
                  href={`/what-we-make/${cat.slug}/${x.slug}`}
                  className="group overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-gold-300 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-sand-100">
                    <Image src={x.image} alt={x.title} fill sizes="(max-width:640px) 100vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-[14px] leading-snug">{x.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </Wrap>
        </section>
      )}

      <NextStep
        title={`Need ${s.title.toLowerCase()}?`}
        body="Send the quantity and size breakdown. If something you have asked for will not work, we will say so before you commit."
        primary={{ href: `/quote?product=${cat.slug}&item=${s.slug}`, label: "Get a quote" }}
        secondary={{ href: `/what-we-make/${cat.slug}`, label: `All ${cat.nav.toLowerCase()}` }}
      />
    </>
  );
}
