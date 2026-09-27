import type { Metadata } from "next";
import { Btn, Jsonld, Notice, SectionHead, Wrap } from "@/components/ui";
import { PRICING, SITE } from "@/lib/content";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "How Pricing Works — What Actually Drives a Garment Rate",
  description:
    "A transparent breakdown of what goes into a per-piece garment rate: fabric, consumption, process, branding and quantity slabs — and why small runs cost more per piece.",
  alternates: { canonical: "/pricing" },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What determines the price of a custom t-shirt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Five things: the fabric rate, how much fabric the garment consumes, the cost of cutting and stitching it, the branding method and number of positions, and the order quantity. Quantity matters because several costs are fixed per order rather than per piece.",
      },
    },
    {
      "@type": "Question",
      name: "Why is a small order more expensive per piece?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fabric minimums, screen setup, pattern preparation and machine changeover are paid once per order regardless of size. On a 20-piece run those fixed costs are divided across 20 pieces; on a 2,000-piece run they effectively disappear into the rate.",
      },
    },
  ],
};

const FACTORS = [
  { n: "01", h: "Fabric rate", p: "What the knit itself costs. Driven by construction, yarn count and colour. An unusual shade at low quantity can cost more than a standard one, because dyeing carries a minimum lot size." },
  { n: "02", h: "Consumption", p: "How much fabric one garment uses. A hoodie uses close to double a standard tee, and larger sizes use more than smaller ones — which is exactly why the size breakdown changes the number." },
  { n: "03", h: "Process cost", p: "Cutting, stitching, checking, ironing and packing. Driven by how many operations the garment needs. A polo with a collar and placket takes more work than a plain round-neck." },
  { n: "04", h: "Branding", p: "Method and number of positions. Screen printing carries a setup cost per colour that is paid once; DTF and DTG carry none. Embroidery is priced on stitch count." },
  { n: "05", h: "Quantity slab", p: "Fixed costs divided across the run. This is the factor buyers underestimate most, and the reason the same garment can differ substantially in rate between 20 pieces and 500." },
];

export default function PricingPage() {
  return (
    <>
      <Jsonld data={faqLd} />

      <section className="border-b border-sand-200 bg-sand-50 py-14 lg:py-16">
        <Wrap className="max-w-[820px]">
          <h1 className="mb-4 text-[clamp(30px,4.4vw,46px)]">
            What actually goes into a rate
          </h1>
          <p className="text-[17px] leading-relaxed text-ink-500">
            Most manufacturers treat pricing as a black box, then negotiate
            from a number nobody can explain. Here is the whole structure. If
            you understand how a rate is built, you can tell the difference
            between a fair quote and a padded one — including on quotes that
            are not ours.
          </p>
        </Wrap>
      </section>

      <section className="py-16">
        <Wrap>
          <SectionHead eyebrow="The five factors" title="Everything that moves the number" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FACTORS.map((f) => (
              <div key={f.n} className="rounded-2xl border border-sand-200 bg-white p-6">
                <b className="mb-3 inline-grid size-8 place-items-center rounded-lg bg-navy-800 text-[13px] font-bold text-gold-400">
                  {f.n}
                </b>
                <h3 className="mb-2 text-[17px]">{f.h}</h3>
                <p className="text-[14px] leading-relaxed text-ink-500">{f.p}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      <section className="bg-navy-800 py-16 text-[#c9d4e4]">
        <Wrap>
          <SectionHead dark eyebrow="The formula" title="Exactly how our calculator works"
            lead="This is the real formula behind the estimate on the quote page. We are publishing it because a buyer who can reproduce the arithmetic does not have to trust us to be fair — they can check." />
          <div className="overflow-x-auto rounded-2xl border border-white/12 bg-navy-900 p-6">
            <pre className="text-[13.5px] leading-[1.9] text-[#c9d4e4]">
{`base      = fabricRate × consumption
subtotal  = base + processCost + (brandingRate × positions)
unit      = subtotal × (1 + margin) × quantitySlabMultiplier

shown     = unit ±10%          → always a range, never a single figure
order     = unit × quantity + one-time setup`}
            </pre>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-[17px] text-white">Quantity slabs</h3>
              <div className="overflow-hidden rounded-xl border border-white/12">
                <table className="w-full text-left text-[13.5px]">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-[#8ea0b9]">Quantity</th>
                      <th className="px-4 py-2.5 font-semibold text-[#8ea0b9]">Relative rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRICING.slabs.map((s) => (
                      <tr key={s.label} className="border-t border-white/8">
                        <td className="px-4 py-2.5 text-[#e3e9f2]">{s.label}</td>
                        <td className="px-4 py-2.5 text-[#c9d4e4]">
                          ×{s.multiplier.toFixed(2)}
                          {s.multiplier === 1 && <span className="ml-2 text-[11.5px] text-[#7f93ae]">baseline</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-[17px] text-white">Why a range, not a price</h3>
              <p className="mb-3 text-[14.5px] leading-relaxed text-[#9fb0c7]">
                A single figure implies a precision that does not exist before
                artwork, colour and fabric are confirmed. A range is honest
                about the uncertainty, and it narrows to a firm number once
                those three are fixed.
              </p>
              <p className="text-[14.5px] leading-relaxed text-[#9fb0c7]">
                Anyone quoting you an exact per-piece rate from a one-line
                enquiry is either guessing or leaving themselves room to
                revise it later.
              </p>
            </div>
          </div>
        </Wrap>
      </section>

      <section className="py-16">
        <Wrap className="max-w-[820px]">
          <SectionHead eyebrow="Honesty note" title="The rates in our calculator are not real yet" />
          <Notice>
            <strong>Every rate currently feeding the estimate is a placeholder.</strong>{" "}
            The structure above is exactly what will run in production — the
            numbers inside it are invented for demonstration. They live in a
            single file (<code>content/pricing.json</code>) and will be
            replaced with the unit&apos;s actual costing. We would rather show
            you a working mechanism with fake numbers than a polished page
            with numbers we cannot stand behind.
          </Notice>

          <div className="mt-8 flex flex-wrap gap-3">
            <Btn href="/quote" variant="navy" size="lg">Try the calculator</Btn>
            <Btn href="/guides/moq-and-per-piece-rates" variant="ghost" size="lg">
              Why small runs cost more
            </Btn>
          </div>

          <p className="mt-8 text-[14px] leading-relaxed text-ink-400">
            Minimum order {SITE.business.moq} pieces. Delivery is quoted
            separately from the garment rate so you can see both.
          </p>
        </Wrap>
      </section>

      <NextStep
        title="See the formula run on your numbers"
        body="Enter a real size breakdown and the calculator applies exactly the arithmetic published above."
        primary={{ href: "/quote", label: "Try the calculator" }}
        secondary={{ href: "/guides/moq-and-per-piece-rates", label: "Why small runs cost more" }}
      />
    </>
  );
}
