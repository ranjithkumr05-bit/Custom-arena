import type { Metadata } from "next";
import QuoteFlow from "@/components/QuoteFlow";
import { SectionHead, Wrap } from "@/components/ui";
import { getCategory, getSub } from "@/lib/content";
import { BackBarUI } from "@/components/BackBar";

export const metadata: Metadata = {
  title: "Get a Quote — Size Breakdown & Live Estimate",
  description:
    "Build a multi-product enquiry with a per-size breakdown, pick colours and branding placement, and see an indicative range instantly. Knitwear from Tiruppur, orders from 10 pieces.",
  alternates: { canonical: "/quote" },
};

/** Category slug -> default product key in the pricing config. */
const MAP: Record<string, string> = {
  "corporate-office": "polo",
  "sportswear-team-jerseys": "jersey",
  "school-college": "tee",
  "workwear-staff": "workwear",
  "retail-store": "polo",
  "hoodies-sweatshirts": "hoodie",
  "group-event": "tee",
  "private-label": "tee",
};

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; item?: string; reorder?: string; kind?: string }>;
}) {
  const { product, item, reorder, kind } = await searchParams;

  // A subcategory link carries ?item= and overrides the category default,
  // so "Cricket Jerseys" opens on jersey rather than the category fallback.
  const sub = product && item ? getSub(product, item) : null;
  const initial = sub?.sub.product ?? (product ? MAP[product] : undefined);
  const label = sub?.sub.title ?? (product ? getCategory(product)?.title : undefined);

  // Return the buyer to whatever they were looking at, not a generic index.
  const cat = product ? getCategory(product) : null;
  const back = sub && cat
    ? { href: `/what-we-make/${cat.slug}/${sub.sub.slug}`, label: sub.sub.title }
    : cat
      ? { href: `/what-we-make/${cat.slug}`, label: cat.title }
      : { href: "/", label: "Home" };
  return (
    <>
    <BackBarUI href={back.href} label={back.label} here="Get a Quote" />
    <section className="py-12 lg:py-14">
      <Wrap>
        <SectionHead
          as="h1"
          eyebrow="Get a quote"
          title="Tell us what you need"
          lead="Four questions and we'll come back with a rate. Fabric, colour and sizes are things we can work out together — you don't need to know them now."
        />
        {label && (
          <p className="-mt-6 mb-7 inline-flex items-center gap-2 rounded-full border border-gold-300 bg-gold-50 px-3.5 py-1.5 text-[13px] font-semibold text-[#8a6d1f]">
            Pre-set for {label}
          </p>
        )}
        <QuoteFlow initialProduct={initial} reorderRef={reorder} initialKind={kind === "sample" ? "sample" : "quote"} />
      </Wrap>
    </section>
    </>
  );
}
