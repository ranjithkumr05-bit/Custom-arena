import Image from "next/image";
import Link from "next/link";
import { Wrap } from "./ui";

/**
 * Page header with a photographic band.
 *
 * The banner images are studio/material photography used decoratively. They
 * are deliberately NOT presented as pictures of our floor — see /work, where
 * real production photos belong.
 */
export default function PageHero({
  eyebrow,
  title,
  lead,
  banner,
  crumbs,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  banner: string;
  crumbs?: { href?: string; label: string }[];
}) {
  return (
    <section className="relative overflow-hidden bg-navy-900">
      <div className="absolute inset-0">
        <Image src={banner} alt="" fill priority sizes="100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,#071528_18%,rgba(7,21,40,.88)_58%,rgba(7,21,40,.62)_100%)]" />
      </div>

      <Wrap className="relative max-w-[820px] py-14 lg:py-16">
        {crumbs && (
          <nav className="mb-3.5 hidden text-[13px] text-[#8ea0b9] sm:block">
            {crumbs.map((c, i) => (
              <span key={c.label}>
                {i > 0 && <span className="mx-1.5 opacity-50">/</span>}
                {c.href ? (
                  <Link href={c.href} className="transition hover:text-gold-300">{c.label}</Link>
                ) : (
                  <span className="text-white">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-500">{eyebrow}</p>
        )}
        <h1 className="text-[clamp(28px,4.4vw,46px)] text-white">{title}</h1>
        {lead && <p className="mt-4 text-[17px] leading-relaxed text-[#a9bad1]">{lead}</p>}
      </Wrap>
    </section>
  );
}
