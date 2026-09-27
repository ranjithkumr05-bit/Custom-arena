import Link from "next/link";
import { SITE } from "@/lib/content";

/**
 * Request-a-sample prompt.
 *
 * A sample is the cheapest way for a buyer to de-risk an order, and the
 * fastest way for us to win one — a physical garment settles questions that
 * a website cannot. The quote builder already supports it via a toggle, but
 * a toggle inside a form is invisible to someone who has not opened the form
 * yet. This surfaces it at the point of hesitation instead.
 *
 * Links carry ?kind=sample so the builder opens on the sample path with the
 * MOQ relaxed to a single piece.
 */
export default function SampleCta({
  product,
  item,
  compact = false,
}: {
  product?: string;
  item?: string;
  compact?: boolean;
}) {
  const qs = new URLSearchParams({ kind: "sample" });
  if (product) qs.set("product", product);
  if (item) qs.set("item", item);
  const href = `/quote?${qs}`;

  if (compact) {
    return (
      <Link
        href={href}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-gold-300 bg-gold-50 px-4 text-[14px] font-semibold text-[#7a5a0b] transition hover:border-gold-500"
      >
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7 12 3 4 7v10l8 4 8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" />
        </svg>
        Request a sample
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-gold-300 bg-gold-50 p-6">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white">
          <svg viewBox="0 0 24 24" className="size-[18px] text-[#a8842f]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7 12 3 4 7v10l8 4 8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" />
          </svg>
        </span>
        <h3 className="text-[17px]">Not sure? Ask for a sample first</h3>
      </div>
      <p className="mb-5 text-[14.5px] leading-relaxed text-[#7a5a0b]">
        One piece, made to your spec, in your hands. It settles fabric weight,
        colour and print quality in a way no photograph can. We make samples
        for orders of <b>75 pieces and above</b> — below that, go straight to a
        bulk quote and we will confirm the spec with you instead.
      </p>
      <div className="flex flex-wrap gap-2.5">
        <Link
          href={href}
          className="inline-flex min-h-[46px] items-center rounded-md bg-navy-800 px-5 text-[14.5px] font-semibold text-white transition hover:bg-navy-700"
        >
          Request a sample
        </Link>
        <Link
          href={product ? `/quote?product=${product}${item ? `&item=${item}` : ""}` : "/quote"}
          className="inline-flex min-h-[46px] items-center rounded-md border border-[#e0b84a] px-5 text-[14.5px] font-semibold text-[#7a5a0b] transition hover:bg-white"
        >
          Quote for bulk instead
        </Link>
      </div>
    </div>
  );
}
