import type { Metadata } from "next";
import Image from "next/image";
import { Btn, Confirm, Notice, SectionHead, Wrap } from "@/components/ui";
import { SITE } from "@/lib/content";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "About — A Family Knitwear Unit in Tiruppur",
  description:
    "A family-run knitwear manufacturing unit in Tiruppur, Tamil Nadu. Knitted fabric only, every production stage in-house, orders from 10 pieces.",
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-sand-200 bg-sand-50 py-14 lg:py-16">
        <Wrap className="max-w-[820px]">
          <h1 className="mb-4 text-[clamp(30px,4.4vw,46px)]">
            A family unit, not a trading desk
          </h1>
          <p className="text-[17px] leading-relaxed text-ink-500">
            We are a family-run knitwear manufacturing unit in Tiruppur, Tamil
            Nadu. We work only in knitted fabric, and every stage of production
            happens on our own floor.
          </p>
        </Wrap>
      </section>

      <section className="py-16">
        <Wrap className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6 text-[16px] leading-[1.75] text-ink-700">
            <p>
              The unit was started by our father as a small stitching operation.
              Our mother works on the floor alongside the team. Production is
              overseen by a family member holding a B.Tech in Textile
              Technology <Confirm label="name needed" />.
            </p>
            <p>
              For most of that time the work came the same way it comes to
              hundreds of units here — an agent brings the order, we make the
              garment, and we are paid a stitching rate. The buyer pays
              considerably more than that rate. The difference stays with
              whoever owns the relationship.
            </p>
            <p>
              This site exists to change that. Not because the margin is unfair
              in principle, but because the person paying it is getting nothing
              for it. The agent does not source your fabric, does not run your
              print, and cannot answer a question about shrinkage. We do all
              three.
            </p>
            <h2 className="pt-2 text-[24px]">Why knits only</h2>
            <p>
              Tiruppur is a knitwear town, and knitwear is a genuine
              specialisation rather than a limitation. Wovens need different
              machines, different patterns and different skills. A unit that
              claims both is usually subcontracting one of them — and when work
              is subcontracted, nobody is accountable for it.
            </p>
            <p>
              Because we do not take woven work, we can say no to an enquiry
              honestly instead of quoting for something we would have to send
              elsewhere.
            </p>
            <h2 className="pt-2 text-[24px]">Why we accept ten pieces</h2>
            <p>
              Small orders are usually refused because they have to queue at an
              outside printer or embroiderer, where a 20-piece job is not worth
              setting up for. With every stage in our own unit, that queue does
              not exist. A ten-piece order is scheduled the same way a
              five-hundred-piece order is — it simply costs more per piece,
              and we show you exactly why.
            </p>
          </div>

          <aside className="space-y-6">
            <div className="overflow-hidden rounded-2xl shadow-lg">
              <Image src="/images/fabric.jpg" alt="Close-up of knitted fabric structure" width={700} height={500} className="size-full object-cover" />
            </div>

            <div className="rounded-2xl border border-sand-200 bg-sand-50 p-6">
              <h3 className="mb-4 text-[16px]">At a glance</h3>
              <dl className="grid gap-3 text-[14px]">
                {[
                  ["Location", `${SITE.location.city}, ${SITE.location.state}`],
                  ["Fabric scope", SITE.business.fabricScope],
                  ["Minimum order", `${SITE.business.moq} pieces`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-sand-200 pb-2.5">
                    <dt className="text-ink-400">{k}</dt>
                    <dd className="text-right font-medium text-navy-800">{v}</dd>
                  </div>
                ))}
                {[
                  ["Years operating", "yearsTrading"],
                  ["Daily capacity", "dailyCapacity"],
                  ["Team size", "teamSize"],
                ].map(([k]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-sand-200 pb-2.5">
                    <dt className="text-ink-400">{k}</dt>
                    <dd className="text-right"><Confirm /></dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl bg-navy-800 p-6 text-[#c9d4e4]">
              <h3 className="mb-2 text-[16px] text-white">Visit the unit</h3>
              <p className="mb-4 text-[14px] leading-relaxed text-[#9fb0c7]">
                We are in Tiruppur and visitors are welcome. Ten minutes on the
                floor answers more than any website.
              </p>
              <Btn href="/contact" variant="gold" className="w-full">Arrange a visit</Btn>
            </div>
          </aside>
        </Wrap>
      </section>

      <section className="bg-sand-50 py-14">
        <Wrap className="max-w-[820px]">
          <SectionHead eyebrow="What we do not claim" title="Deliberately absent from this site" />
          <Notice>
            <strong>No certifications, capacities, client names, awards or
            delivery guarantees appear anywhere on this site.</strong> Not
            because there are none, but because none have been verified for
            publication yet. Competitor sites in this sector routinely list
            audit badges and Fortune-500 client counts that do not survive a
            phone call. An unverified claim is a liability, not a selling point.
          </Notice>
        </Wrap>
      </section>

      <NextStep
        title="Come and see the floor"
        body="We are in Tiruppur and visitors are welcome. Ten minutes on the floor answers more than any website can."
        primary={{ href: "/contact", label: "Arrange a visit" }}
        secondary={{ href: "/quote", label: "Get a quote" }}
      />
    </>
  );
}
