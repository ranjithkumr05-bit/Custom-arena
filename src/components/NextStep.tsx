import Link from "next/link";
import { waHref } from "@/lib/content";
import { Wrap } from "./ui";

/**
 * Contextual end-of-page CTA.
 *
 * Every page ends by naming the single most useful next action for someone
 * who has just read *that* page, rather than repeating one generic banner
 * sitewide. A dead end is a lost enquiry.
 */
export default function NextStep({
  eyebrow = "Next step",
  title,
  body,
  primary = { href: "/quote", label: "Get a quote" },
  secondary,
  showWhatsApp = true,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  showWhatsApp?: boolean;
}) {
  return (
    <section className="bg-navy-900 py-14 lg:py-16">
      <Wrap>
        <div className="mx-auto max-w-[760px] text-center">
          <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-500">
            {eyebrow}
          </p>
          <h2 className="mb-3.5 text-[clamp(24px,3.2vw,34px)] text-white">{title}</h2>
          <p className="mx-auto mb-7 max-w-[560px] text-[16px] leading-relaxed text-[#9fb0c7]">
            {body}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Link
              href={primary.href}
              className="inline-flex min-h-[50px] items-center gap-2 rounded-md bg-gold-500 px-6 text-[15px] font-bold text-navy-900 transition hover:bg-gold-400"
            >
              {primary.label}
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>

            {secondary && (
              <Link
                href={secondary.href}
                className="inline-flex min-h-[50px] items-center rounded-md border border-white/30 px-6 text-[15px] font-semibold text-white transition hover:border-gold-400 hover:text-gold-300"
              >
                {secondary.label}
              </Link>
            )}

            {showWhatsApp && (
              <a
                href={waHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[50px] items-center rounded-md border border-white/30 px-6 text-[15px] font-semibold text-white transition hover:border-[#1faa52] hover:text-[#5fd68d]"
              >
                Ask on WhatsApp
              </a>
            )}
          </div>
        </div>
      </Wrap>
    </section>
  );
}
