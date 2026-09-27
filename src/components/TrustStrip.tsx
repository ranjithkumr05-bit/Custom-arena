import { Confirm, Wrap } from "./ui";
import { Pieces, OneRoof, Direct } from "./icons";
import { SITE } from "@/lib/content";

/**
 * Capability strip.
 *
 * Deliberately built from STRUCTURAL facts — how we are set up — rather than
 * offers or performance promises. Competitor strips lead with things like
 * "free logo printing above 300 pieces" and "fast delivery"; both are
 * commitments, and neither should be published until the business has
 * actually decided them. Anything of that kind belongs in `offers` below,
 * where it renders with a confirm marker until you sign it off.
 */

const ITEMS = [
  {
    title: "Orders from 10 pieces",
    body: "Our minimum, not a headline. Small runs are scheduled like any other.",
    Icon: Pieces,
  },
  {
    title: "Every stage in-house",
    body: "Fabric, cutting, printing, embroidery, stitching, checking, packing.",
    Icon: OneRoof,
  },
  {
    title: "Direct from the unit",
    body: "You are quoted by the people who make the goods. No agent margin.",
    Icon: Direct,
  },
];

/**
 * Offers / commitments. Each one is a promise to a customer, so each stays
 * marked until confirmed. Set `confirm: false` once the business has agreed
 * the terms and it will render as a normal item.
 */
const OFFERS: { title: string; body: string; confirm: boolean }[] = [
  { title: "Free logo setup", body: "Threshold and terms to be decided.", confirm: true },
  { title: "Dispatch timeline", body: "Realistic lead times to be confirmed.", confirm: true },
];

export default function TrustStrip() {
  return (
    <section className="border-b border-sand-200 bg-sand-50 py-8">
      <Wrap>
        <div className="grid gap-3 md:grid-cols-3">
          {ITEMS.map((i) => (
            <div
              key={i.title}
              className="flex items-start gap-3.5 rounded-xl border border-sand-200 bg-white p-4 shadow-[0_1px_2px_rgba(11,31,58,.04)]"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 text-gold-400">
                <i.Icon size={21} />
              </span>
              <span>
                <b className="block text-[15px] font-semibold text-navy-800">{i.title}</b>
                <span className="block text-[13px] leading-snug text-ink-500">{i.body}</span>
              </span>
            </div>
          ))}
        </div>

        {OFFERS.some((o) => o.confirm) && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-400">
            Offer-style claims such as free logo setup or a guaranteed dispatch
            window are deliberately absent
            <Confirm label="awaiting your decision" /> — they are commitments to
            a customer, and {SITE.name} has not set the terms yet. Tell us the
            real thresholds and they go in here.
          </p>
        )}
      </Wrap>
    </section>
  );
}
