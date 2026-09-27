import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Btn, Tag, Wrap } from "@/components/ui";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import { SITE } from "@/lib/content";
import { publicCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "What We Make — Knitwear Categories",
  description:
    "Corporate apparel, sportswear, school and college wear, workwear, hoodies, private label, event runs and retail supply. Knitwear manufactured in Tiruppur from 10 pieces.",
};

export default function WhatWeMake() {
  const CATEGORIES = publicCatalog();
  return (
    <>
    <PageHero
      banner="/banners/banner-stacks.jpg"
      eyebrow="What we make"
      title="What do you need made?"
      lead="Pick whichever is closest. If none of them fit exactly, choose the nearest and tell us the rest — everything here is knitted cotton or performance knit, made in our own unit."
      crumbs={[{ href: "/", label: "Home" }, { label: "What We Make" }]}
    />
    <section className="py-14 lg:py-16">
      <Wrap>

        <div className="grid gap-6 md:grid-cols-2">
          {CATEGORIES.map((c) => (
            <article
              key={c.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition hover:border-gold-300 hover:shadow-lg sm:flex-row"
            >
              <div className="shrink-0 overflow-hidden bg-sand-100 sm:w-[210px]">
                <Image
                  src={c.hero} alt={c.heroAlt} width={500} height={500}
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="mb-1.5 text-[19px]">{c.title}</h2>
                <p className="mb-3 text-[14px] leading-relaxed text-ink-500">{c.summary}</p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {c.subcategories.slice(0, 3).map((x) => <Tag key={x.slug}>{x.title}</Tag>)}
                  {c.subcategories.length > 3 && <Tag>+{c.subcategories.length - 3} more</Tag>}
                  <Tag gold>MOQ {SITE.business.moq}</Tag>
                </div>
                <Link
                  href={`/what-we-make/${c.slug}`}
                  className="mt-auto inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-navy-800 transition-colors group-hover:text-gold-500"
                >
                  View {c.subcategories.length} types
                  <span className="grid size-6 place-items-center rounded-full bg-sand-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-gold-500 group-hover:text-navy-900">
                    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Btn href="/quote" variant="navy" size="lg">Get a quote</Btn>
          <Btn href="/fabrics" variant="ghost" size="lg">Compare fabrics</Btn>
        </div>
      </Wrap>
    </section>

    <NextStep
      title="Not sure which category fits?"
      body="Describe what you need in plain words. We will tell you the construction, the branding method and roughly what it costs."
      primary={{ href: "/quote", label: "Get a quote" }}
      secondary={{ href: "/fabrics", label: "Compare fabrics" }}
    />
    </>
  );
}
