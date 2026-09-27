import Link from "next/link";
import { CATEGORIES, SITE, isPublishable, waHref } from "@/lib/content";
import { Confirm, Wrap } from "./ui";
import Logo from "./Logo";

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h5 className="mb-3.5 text-[11.5px] font-bold uppercase tracking-[0.12em] text-gold-400">
        {title}
      </h5>
      <ul className="grid sm:gap-2.5">{children}</ul>
    </div>
  );
}

// min-h on mobile only: a 16px text link is not a tap target. Desktop keeps
// the tighter list rhythm.
const linkCls =
  "flex min-h-[44px] items-center text-[14px] text-[#8ea0b9] transition hover:text-gold-300 sm:block sm:min-h-0";

export default function Footer() {
  const c = SITE.contact;
  return (
    <footer className="border-t border-white/10 bg-navy-900 pb-7 pt-14 text-[#8ea0b9]">
      <Wrap>
        <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="mb-3 inline-flex min-h-[44px] min-w-[44px] items-center px-3" aria-label="CustomWear home">
              <Logo light size={40} />
            </Link>
            <p className="max-w-[300px] text-[14px] leading-relaxed">
              Knitwear manufacturing in Tiruppur, Tamil Nadu. Corporate,
              sportswear, campus, workwear and private label — produced in our
              own unit, from fabric to dispatch.
            </p>
          </div>

          <Col title="What we make">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <li key={cat.slug}>
                <Link href={`/what-we-make/${cat.slug}`} className={linkCls}>
                  {cat.title}
                </Link>
              </li>
            ))}
          </Col>

          <Col title="How we work">
            <li><Link href="/process" className={linkCls}>In-house process</Link></li>
            <li><Link href="/fabrics" className={linkCls}>Fabrics</Link></li>
            <li><Link href="/guides" className={linkCls}>Guides</Link></li>
            <li><Link href="/glossary" className={linkCls}>Glossary</Link></li>
            <li><Link href="/pricing" className={linkCls}>How pricing works</Link></li>
            <li><Link href="/work" className={linkCls}>Our work</Link></li>
            <li><Link href="/my-orders" className={linkCls}>My orders</Link></li>
            <li><Link href="/track" className={linkCls}>Track by reference</Link></li>
          </Col>

          <Col title="Contact">
            <li><Link href="/quote" className={linkCls}>Request a quote</Link></li>
            <li>
              <a href={waHref()} target="_blank" rel="noopener noreferrer" className={linkCls}>
                WhatsApp
              </a>
            </li>
            <li className="flex min-h-[44px] items-center text-[14px] sm:block sm:min-h-0">
              {isPublishable(c.phone) ? c.phone.value : <>Phone <Confirm /></>}
            </li>
            <li className="flex min-h-[44px] items-center text-[14px] sm:block sm:min-h-0">
              {isPublishable(c.email) ? c.email.value : <>Email <Confirm /></>}
            </li>
            <li className="flex min-h-[44px] items-center text-[14px] sm:block sm:min-h-0">
              {isPublishable(SITE.location.addressLine) ? (
                SITE.location.addressLine.value
              ) : (
                <>Address <Confirm /></>
              )}
            </li>
          </Col>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-5 text-[12.5px]">
          <span>© {new Date().getFullYear()} CustomWear, Tiruppur. Preview build.</span>
          <span>
            No certifications, capacities, client names or lead times are claimed on this site.
          </span>
        </div>
      </Wrap>
    </footer>
  );
}
