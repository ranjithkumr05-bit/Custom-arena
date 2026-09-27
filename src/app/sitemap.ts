import type { MetadataRoute } from "next";
import { GUIDES, SITE } from "@/lib/content";
import { allPublicSubs, publicCatalog } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date();

  const statics: MetadataRoute.Sitemap = (
    [
      { url: base, changeFrequency: "monthly", priority: 1 },
      { url: `${base}/what-we-make`, changeFrequency: "monthly", priority: 0.9 },
      { url: `${base}/quote`, changeFrequency: "yearly", priority: 0.9 },
      { url: `${base}/fabrics`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${base}/process`, changeFrequency: "yearly", priority: 0.7 },
      { url: `${base}/guides`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${base}/glossary`, changeFrequency: "monthly", priority: 0.75 },
      { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${base}/about`, changeFrequency: "yearly", priority: 0.6 },
      { url: `${base}/work`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.7 },
      { url: `${base}/track`, changeFrequency: "yearly", priority: 0.4 },
    ] satisfies MetadataRoute.Sitemap
  ).map((e) => ({ ...e, lastModified: now }));

  const cats: MetadataRoute.Sitemap = publicCatalog().map((c) => ({
    url: `${base}/what-we-make/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const guides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${base}/guides/${g.slug}`,
    lastModified: new Date(g.updated),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const subs: MetadataRoute.Sitemap = allPublicSubs().map(({ cat, sub }) => ({
    url: `${base}/what-we-make/${cat.slug}/${sub.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...statics, ...cats, ...subs, ...guides];
}
