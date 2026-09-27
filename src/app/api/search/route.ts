import { NextResponse } from "next/server";
import { DECORATION, FABRICS, GUIDES, PROCESS, publishableFaqs } from "@/lib/content";
import { allPublicSubs, publicCatalog } from "@/lib/catalog";
import { GLOSSARY } from "@/lib/glossary";

export const dynamic = "force-dynamic";

export interface SearchDoc {
  t: string;   // title
  d: string;   // description
  u: string;   // url
  k: string;   // kind
  b: string;   // haystack
}

function buildDocs(): SearchDoc[] {
  const CATEGORIES = publicCatalog();
  return [
  ...CATEGORIES.map((c) => ({
    t: c.title, d: c.summary, u: `/what-we-make/${c.slug}`, k: "Category",
    b: [c.title, c.summary, c.intro, ...c.buyers, ...c.subcategories.map((s) => s.title)].join(" ").toLowerCase(),
  })),
  ...allPublicSubs().map(({ cat, sub }) => ({
    t: sub.title, d: sub.blurb, u: `/what-we-make/${cat.slug}/${sub.slug}`, k: "Subcategory",
    b: [sub.title, sub.blurb, cat.title].join(" ").toLowerCase(),
  })),
  ...GUIDES.map((g) => ({
    t: g.title, d: g.excerpt, u: `/guides/${g.slug}`, k: "Guide",
    b: [g.title, g.excerpt, g.question, g.answer, ...g.sections.map((s) => s.h + " " + s.p)].join(" ").toLowerCase(),
  })),
  ...FABRICS.map((f) => ({
    t: f.name, d: f.plainEnglish, u: "/fabrics", k: "Fabric",
    b: [f.name, f.family, f.plainEnglish, ...f.usedFor, f.takesPrint].join(" ").toLowerCase(),
  })),
  ...DECORATION.map((d) => ({
    t: d.name, d: d.bestFor, u: "/fabrics", k: "Branding",
    b: [d.name, d.how, d.bestFor, ...d.strengths, ...d.limits].join(" ").toLowerCase(),
  })),
  ...PROCESS.map((p) => ({
    t: p.title, d: p.short, u: "/process", k: "Process",
    b: [p.title, p.short, p.detail].join(" ").toLowerCase(),
  })),
  ...publishableFaqs().map((f) => ({
    t: f.q, d: f.a.slice(0, 120), u: "/#faq", k: "FAQ",
    b: (f.q + " " + f.a).toLowerCase(),
  })),
  ...GLOSSARY.map((g) => ({
    t: g.term, d: g.def, u: `/glossary#${g.slug}`, k: "Glossary",
    b: (g.term + " " + g.def + " " + (g.also ?? "")).toLowerCase(),
  })),
  { t: "Get a quote", d: "Size-breakdown quote builder with live estimate", u: "/quote", k: "Page", b: "quote price estimate rate cost calculator rfq enquiry" },
  { t: "Track an order", d: "Check production stage by reference", u: "/track", k: "Page", b: "track order status reference production stage" },
  { t: "Cost breakdown", d: "Where the money in a garment actually goes", u: "/pricing", k: "Page", b: "cost price breakdown margin transparent pricing rate" },
  { t: "Contact", d: "WhatsApp, phone and visiting the unit", u: "/contact", k: "Page", b: "contact phone whatsapp email address visit tiruppur" },
  { t: "About", d: "A family knitwear unit in Tiruppur", u: "/about", k: "Page", b: "about family unit tiruppur history story knits only" },
  ];
}

export function GET() {
  return NextResponse.json({ docs: buildDocs() });
}
