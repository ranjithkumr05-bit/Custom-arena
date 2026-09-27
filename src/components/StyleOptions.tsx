import { STYLES } from "@/lib/content";
import { Eyebrow, Wrap } from "./ui";

/**
 * Neck / sleeve / fit options.
 *
 * Buyers frequently assume a category locks them into one body style. It does
 * not — any combination below can be made, so this is stated on every category
 * page rather than buried in an FAQ.
 */
function Group({
  title,
  items,
}: {
  title: string;
  items: { slug: string; label: string; note?: string; popular?: boolean }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-[0.1em] text-ink-400">
        {title}
      </h3>
      <ul className="grid gap-2">
        {items.map((i) => (
          <li
            key={i.slug}
            className="rounded-lg border border-sand-200 bg-white px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-navy-800">{i.label}</span>
              {i.popular && (
                <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a6d1f]">
                  common
                </span>
              )}
            </div>
            {i.note && <p className="mt-0.5 text-[12.5px] leading-snug text-ink-500">{i.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StyleOptions() {
  return (
    <section className="border-y border-sand-200 bg-sand-50 py-14">
      <Wrap>
        <div className="mb-8 max-w-[720px]">
          <Eyebrow>Made to your preference</Eyebrow>
          <h2 className="mb-3 text-[clamp(24px,3.2vw,32px)]">
            Round neck, polo, or anything else you want
          </h2>
          <p className="text-[16px] leading-relaxed text-ink-500">
            The category does not lock you into one body style. Every item here
            can be made with the neck, sleeve and fit you choose — mix them
            freely, and combine different styles within a single order.
          </p>
        </div>

        <div className="grid gap-7 md:grid-cols-3">
          <Group title="Neck style" items={STYLES.necks} />
          <Group title="Sleeve" items={STYLES.sleeves} />
          <Group title="Fit" items={STYLES.fits} />
        </div>

        <p className="mt-7 rounded-lg border border-sand-200 bg-white px-5 py-3.5 text-[14px] leading-relaxed text-ink-500">
          {STYLES.note}
        </p>
      </Wrap>
    </section>
  );
}
