import site from "../../content/site.json";
import categories from "../../content/categories.json";
import fabrics from "../../content/fabrics.json";
import process from "../../content/process.json";
import decoration from "../../content/decoration.json";
import faqs from "../../content/faqs.json";
import guides from "../../content/guides.json";
import pricing from "../../content/pricing.json";
import styles from "../../content/styles.json";
import { STATUS_STAGE_SLUG } from "./rfq";

export type Confirmable<T = string> = { value: T; confirm: boolean };

export type Category = (typeof categories)[number];
export type Fabric = (typeof fabrics)[number];
export type Stage = (typeof process)[number];
export type Decoration = (typeof decoration)[number];
export type Faq = (typeof faqs)[number];
export type Guide = (typeof guides)[number];

export const SITE = site;
export const CATEGORIES = categories;
export const FABRICS = fabrics;
export const PROCESS = process;
export const DECORATION = decoration;
export const FAQS = faqs;
export const GUIDES = guides;
export const PRICING = pricing;
export const STYLES = styles;

/** A value is publishable only when it is present AND confirmed. */
export function isPublishable(f?: { value: unknown; confirm: boolean } | null) {
  if (!f) return false;
  if (f.confirm) return false;
  return f.value !== null && f.value !== "" && f.value !== undefined;
}

export type Subcategory = Category["subcategories"][number];

/** Resolve a status to its index in PROCESS, or -1 if not yet in production. */
export function stageIndexFor(status: string): number {
  const slug = (STATUS_STAGE_SLUG as Record<string, string | null>)[status];
  if (!slug) return -1;
  const i = PROCESS.findIndex((p) => p.slug === slug);
  if (i === -1) {
    // A slug that no longer exists is a content bug, not a runtime one.
    console.warn(`[process] status "${status}" maps to unknown stage "${slug}"`);
  }
  return i;
}

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getSub(catSlug: string, subSlug: string) {
  const cat = getCategory(catSlug);
  const sub = cat?.subcategories.find((s) => s.slug === subSlug);
  return cat && sub ? { cat, sub } : null;
}

/** Every category/subcategory pair, for static params and the search index. */
export function allSubcategories() {
  return CATEGORIES.flatMap((c) =>
    c.subcategories.map((s) => ({ cat: c, sub: s }))
  );
}

/** Subcategories still awaiting bespoke photography. */
export function subsAwaitingArt() {
  return allSubcategories().filter(
    ({ sub }) => (sub as { imagePending?: boolean }).imagePending
  );
}

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}

export function getFabric(slug: string) {
  return FABRICS.find((f) => f.slug === slug);
}

export function getDecoration(slug: string) {
  return DECORATION.find((d) => d.slug === slug);
}

/** FAQs safe to publish and expose to answer engines. */
export function publishableFaqs() {
  return FAQS.filter((f) => !f.confirm && f.a.trim().length > 0);
}

export function waHref(text?: string) {
  const num = SITE.contact.whatsapp.value;
  const msg =
    text ??
    "Hi, I would like a quote.\n\nProduct:\nQuantity:\nSizes:\nDelivery city:\n\nPlease confirm rate and timeline.";
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}
