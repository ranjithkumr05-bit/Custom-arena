import type { Metadata } from "next";
import { Btn, Jsonld, SectionHead, Wrap } from "@/components/ui";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import SampleCta from "@/components/SampleCta";
import { PROCESS_ICONS } from "@/components/icons";
import Image from "next/image";
import { DECORATION, PROCESS, SITE, getDecoration } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our In-House Process — Fabric Sourcing to Dispatch",
  description:
    "Every stage of production happens in our own unit: fabric sourcing, cutting, printing, embroidery, sublimation, stitching, checking, ironing, packing and dispatch.",
};

const ld = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How a knitwear order is produced",
  description:
    "The eight in-house stages a custom knitwear order moves through, from fabric sourcing to dispatch.",
  step: PROCESS.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.title,
    text: s.detail,
  })),
};

export default function ProcessPage() {
  return (
    <>
      <Jsonld data={ld} />

      <PageHero
        banner="/banners/banner-materials.jpg"
        eyebrow="In-house process"
        title="What happens after you order"
        crumbs={[{ href: "/", label: "Home" }, { label: "Process" }]}
      />
      <section className="border-b border-sand-200 bg-sand-50 py-12">
        <Wrap className="max-w-[820px]">
          <p className="text-[17px] leading-relaxed text-ink-500">
            Most units in Tiruppur send printing, embroidery or sublimation to
            an outside vendor. That is why small orders get pushed back — your
            20 pieces sit behind someone else&apos;s 2,000 in a queue you cannot
            see. Every stage below happens inside our unit, which is the actual
            reason we can accept an order of {SITE.business.moq} pieces.
          </p>
        </Wrap>
      </section>

      <section className="py-16">
        <Wrap>
          <ol className="relative grid gap-6">
            {PROCESS.map((s) => (
              <li
                key={s.slug}
                className="grid gap-5 rounded-2xl border border-sand-200 bg-white p-6 sm:grid-cols-[auto_1fr] sm:p-7"
              >
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 text-gold-400">
                  {(() => { const Ico = PROCESS_ICONS[s.slug]; return Ico ? <Ico size={24} /> : <span className="text-[16px] font-bold">{s.n}</span>; })()}
                </div>
                <div>
                  <h2 className="mb-1.5 text-[20px]">{s.title}</h2>
                  <p className="mb-2.5 text-[15px] font-medium text-navy-800">{s.short}</p>
                  <p className="text-[15px] leading-relaxed text-ink-500">{s.detail}</p>

                  {"branch" in s && s.branch && (
                    <div className="mt-5 rounded-xl border border-gold-300 bg-gold-50 p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gold-500 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-navy-900">
                          Choose one
                        </span>
                        <span className="text-[13px] font-semibold text-[#7a5a0b]">
                          {"branchNote" in s ? s.branchNote : ""}
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {("methods" in s ? s.methods : []).map((m: string) => {
                          const d = getDecoration(m);
                          return (
                            <div key={m} className="rounded-lg border border-[#e6d3a4] bg-white p-3">
                              <div className="text-[13.5px] font-semibold text-navy-800">{d?.name ?? m}</div>
                              <div className="mt-0.5 text-[12px] leading-snug text-ink-500">{d?.bestFor}</div>
                              <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gold-500">
                                {d?.goodQty}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {"timing" in s && (
                        <p className="mt-3 border-t border-[#e6d3a4] pt-2.5 text-[12.5px] leading-relaxed text-[#7a5a0b]">
                          <b>When it happens:</b> {s.timing}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Wrap>
      </section>

      {/* Fills the dead space after the stage list. Material study, not a
          picture of our floor — that distinction is deliberate. */}
      <section className="relative h-[180px] overflow-hidden sm:h-[240px] lg:h-[300px]">
        <Image src="/banners/banner-stages.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(5,15,30,.55),transparent_45%,rgba(5,15,30,.35))]" />
        <div className="absolute inset-x-0 bottom-0">
          <Wrap className="pb-5">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-gold-400">
              Yarn · fabric · cut panel · finished piece
            </p>
          </Wrap>
        </div>
      </section>

      <section className="py-14">
        <Wrap className="max-w-[820px]">
          <SectionHead
            eyebrow="Before bulk"
            title="Most orders start with one piece"
            lead="For anything new, we make a sample first so fit, colour and branding are confirmed against something physical. Nothing goes to bulk on an assumption."
          />
          <SampleCta />
        </Wrap>
      </section>

      <section className="bg-sand-50 py-16">
        <Wrap>
          <SectionHead
            eyebrow="Order tracking"
            title="You can see which stage your order is at"
            lead="Every confirmed order gets a reference. Enter it on the tracking page to see the current production stage rather than messaging to ask."
          />
          <div className="flex flex-wrap gap-3">
            <Btn href="/track" variant="navy" size="lg">Track an order</Btn>
            <Btn href="/quote" variant="ghost" size="lg">Get a quote</Btn>
          </div>
        </Wrap>
      </section>
    </>
  );
}
