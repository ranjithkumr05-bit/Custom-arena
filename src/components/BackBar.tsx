"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, GUIDES, getCategory, getSub } from "@/lib/content";
import { Wrap } from "./ui";

/**
 * Sitewide back control.
 *
 * Deliberately HIERARCHICAL rather than history-based. `router.back()` sends
 * you to whatever you happened to view last, which may be unrelated — and a
 * button labelled "Back to Sportswear" that lands you somewhere else is worse
 * than no button. This always goes one level up the content tree, and the
 * label always names exactly where you will land.
 *
 * Uses `usePathname` only. An earlier version read `useSearchParams`, which
 * forces the whole bar behind a Suspense boundary and made it vanish from the
 * prerendered HTML of every static page. Pages that genuinely need the query
 * string (only /quote) render `BackBarUI` themselves, server-side.
 */

const SECTION_LABEL: Record<string, string> = {
  "what-we-make": "What We Make",
  guides: "Guides",
  glossary: "Glossary",
  fabrics: "Fabrics",
  process: "Process",
  pricing: "Pricing",
  about: "About",
  work: "Our Work",
  quote: "Get a Quote",
  track: "Track Order",
  "my-orders": "My Orders",
  contact: "Contact",
  brand: "Brand Kit",
};

/** Presentational only — safe to render from a server component. */
export function BackBarUI({
  href,
  label,
  here,
}: {
  href: string;
  label: string;
  here?: string | null;
}) {
  return (
    <div className="sticky top-[72px] z-40 border-b border-sand-200 bg-white/95 backdrop-blur-md">
      <Wrap className="flex items-center gap-3 py-2">
        <Link
          href={href}
          className="-ml-2.5 inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-md px-2.5 text-[14px] font-semibold text-navy-800 transition hover:bg-sand-100"
        >
          <svg viewBox="0 0 24 24" className="size-[17px] shrink-0" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m6-6-6 6 6 6" />
          </svg>
          <span className="max-w-[48vw] truncate sm:max-w-none">
            <span className="text-ink-400">Back to </span>
            {label}
          </span>
        </Link>

        {here && (
          <span className="ml-auto hidden min-w-0 truncate text-[13px] text-ink-400 sm:block">
            {here}
          </span>
        )}
      </Wrap>
    </div>
  );
}

function resolveParent(path: string): { href: string; label: string } | null {
  const seg = path.split("/").filter(Boolean);
  if (seg.length === 0) return null;

  if (seg[0] === "what-we-make" && seg.length === 3) {
    const found = getSub(seg[1], seg[2]);
    if (found) return { href: `/what-we-make/${found.cat.slug}`, label: found.cat.title };
  }
  if (seg[0] === "what-we-make" && seg.length === 2) {
    return { href: "/what-we-make", label: "What We Make" };
  }
  if (seg[0] === "guides" && seg.length === 2) {
    return { href: "/guides", label: "Guides" };
  }
  return { href: "/", label: "Home" };
}

function currentLabel(path: string): string | null {
  const seg = path.split("/").filter(Boolean);
  if (seg.length === 0) return null;

  if (seg[0] === "what-we-make" && seg.length === 3) {
    return getSub(seg[1], seg[2])?.sub.title ?? null;
  }
  if (seg[0] === "what-we-make" && seg.length === 2) {
    return getCategory(seg[1])?.title ?? null;
  }
  if (seg[0] === "guides" && seg.length === 2) {
    return GUIDES.find((g) => g.slug === seg[1])?.title ?? null;
  }
  return SECTION_LABEL[seg[0]] ?? null;
}

export default function BackBar() {
  const path = usePathname();

  // /quote supplies its own so it can honour ?product= and ?item=.
  // /what-we-make/* and /quote render BackBarUI themselves, server-side, so
  // their labels come from the live catalog rather than the bundled seed.
  if (
    path === "/" ||
    path.startsWith("/admin") ||
    path === "/quote" ||
    path === "/my-orders" ||
    /^\/what-we-make\/.+/.test(path)
  ) return null;

  const parent = resolveParent(path);
  if (!parent) return null;

  return <BackBarUI href={parent.href} label={parent.label} here={currentLabel(path)} />;
}

export { CATEGORIES };
