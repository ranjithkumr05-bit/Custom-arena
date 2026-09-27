import type { Metadata } from "next";
import Image from "next/image";
import { Btn, Confirm, Notice, SectionHead, Wrap } from "@/components/ui";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import SampleCta from "@/components/SampleCta";
import { DECORATION, FABRICS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Knit Fabrics — Single Jersey, Pique, Interlock, Fleece",
  description:
    "The knit constructions we work in and what each is used for: single jersey, pique, interlock, rib, fleece, loop knit and performance polyester.",
};

export default function FabricsPage() {
  return (
    <>
      <PageHero
        banner="/banners/banner-fabric.jpg"
        eyebrow="Fabrics"
        title="We work in knits. Only knits."
        lead="That focus is deliberate. Our machines, our team and our fabric sourcing are all built around knitted cotton and performance knits. We do not take woven work, and we would rather tell you that than subcontract it."
        crumbs={[{ href: "/", label: "Home" }, { label: "Fabrics" }]}
      />

      <section className="py-16">
        <Wrap>
          <SectionHead
            eyebrow="Constructions"
            title="What each knit is actually for"
            lead="Plain-English descriptions rather than mill terminology. If you know the garment you want, this tells you the fabric it is usually made from."
          />

          {/* A 720px table inside a 360px screen becomes a horizontal
              scroll nobody discovers. Same data, two layouts: cards on a
              phone, table from md up. */}
          <div className="grid gap-3 md:hidden">
            {FABRICS.map((f) => (
              <div key={f.slug} className="rounded-xl border border-sand-200 bg-white p-4">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[16px]">{f.name}</h3>
                  <span className="text-[11.5px] text-ink-400">{f.family}</span>
                </div>
                <p className="mb-3 text-[14px] leading-relaxed text-ink-500">{f.plainEnglish}</p>
                <dl className="grid gap-2 border-t border-sand-100 pt-3 text-[13px]">
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Used for</dt>
                    <dd className="text-ink-500">{f.usedFor.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Takes print</dt>
                    <dd className="text-ink-500">{f.takesPrint}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">GSM</dt>
                    <dd><Confirm /></dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-sand-200">
                  {["Construction", "In plain English", "Used for", "Takes print"].map((h) => (
                    <th key={h} className="pb-3 pr-5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FABRICS.map((f) => (
                  <tr key={f.slug} className="border-b border-sand-100 align-top">
                    <td className="py-4 pr-5">
                      <div className="text-[15px] font-semibold text-navy-800">{f.name}</div>
                      <div className="text-[12.5px] text-ink-400">{f.family}</div>
                      <div className="mt-1 text-[12px] text-ink-400">GSM <Confirm /></div>
                    </td>
                    <td className="py-4 pr-5 text-[14px] leading-relaxed text-ink-500">{f.plainEnglish}</td>
                    <td className="py-4 pr-5 text-[14px] text-ink-500">{f.usedFor.join(", ")}</td>
                    <td className="py-4 text-[14px] leading-relaxed text-ink-500">{f.takesPrint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 max-w-[760px]">
            <div className="mb-5"><SampleCta /></div>
            <Notice>
              <strong>GSM ranges are deliberately blank.</strong> Send your
              actual working ranges per construction and they will be filled
              in. We will not publish fabric weights you have not confirmed —
              a buyer who orders against a wrong number will not order twice.
            </Notice>
          </div>
        </Wrap>
      </section>

      <section className="bg-sand-50 py-16">
        <Wrap>
          <SectionHead
            eyebrow="Branding methods"
            title="Which method suits which fabric"
            lead="Fabric and branding method are linked. Sublimation only works on polyester; embroidery suits pique better than fine print does."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {DECORATION.map((d) => (
              <div key={d.slug} className="rounded-2xl border border-sand-200 bg-white p-6">
                <h3 className="mb-2 text-[17px]">{d.name}</h3>
                <p className="mb-4 text-[14px] leading-relaxed text-ink-500">{d.how}</p>
                <div className="mb-3">
                  <div className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-gold-500">Strengths</div>
                  <ul className="grid gap-1">
                    {d.strengths.map((s) => (
                      <li key={s} className="text-[13.5px] text-ink-500">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="mb-3">
                  <div className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">Limits</div>
                  <ul className="grid gap-1">
                    {d.limits.map((s) => (
                      <li key={s} className="text-[13.5px] text-ink-500">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-sand-100 pt-3 text-[13px] font-semibold text-navy-800">
                  Works best at {d.goodQty.toLowerCase()}
                </div>
              </div>
            ))}
          </div>

        </Wrap>
      </section>

      <NextStep
        title="Still unsure which fabric?"
        body="Tell us the garment and how it will be used. We will recommend a construction — including when the cheaper one is the right answer."
        primary={{ href: "/quote", label: "Get a quote" }}
        secondary={{ href: "/guides/printing-methods-compared", label: "Compare branding methods" }}
      />
    </>
  );
}
