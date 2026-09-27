import type { Metadata } from "next";
import Image from "next/image";
import { Mark, MarkLight } from "@/components/Logo";
import { Notice, Wrap } from "@/components/ui";

export const metadata: Metadata = {
  title: "Brand Kit",
  description: "Logo files, colour tokens and usage rules for CustomWear.",
  robots: { index: false, follow: false },
};

const COLOURS = [
  ["Navy 900", "#071528", "Mark background, dark sections"],
  ["Navy 800", "#0b1f3a", "Headings, primary buttons"],
  ["Navy 700", "#122d50", "Gradient top"],
  ["Gold 500", "#c8a24a", "The loops, accents, primary CTA"],
  ["Gold 400", "#d9b967", "Hover state"],
  ["Sand 50", "#faf9f6", "Page background"],
  ["Sand 200", "#e5e2d8", "Borders"],
  ["Ink 500", "#5b6270", "Body text"],
];

const FILES = [
  ["logo-horizontal.svg", "Default lockup, light backgrounds"],
  ["logo-horizontal-light.svg", "Same lockup, dark backgrounds"],
  ["logo-stacked.svg", "Square spaces, social avatars"],
  ["mark.svg", "Mark alone, 32px and above"],
  ["favicon.svg", "Browser tab, app icon"],
];

const BANNERS = [
  ["banner-stacks.jpg", "What We Make"],
  ["banner-fabric.jpg", "Fabrics"],
  ["banner-materials.jpg", "Process"],
  ["banner-editorial.jpg", "Guides, Contact"],
  ["og-card.jpg", "Social share card"],
];

export default function BrandPage() {
  return (
    <section className="py-14 lg:py-16">
      <Wrap>
        <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-500">
          Internal reference
        </p>
        <h1 className="mb-3 text-[clamp(28px,4vw,42px)]">Brand kit</h1>
        <p className="mb-10 max-w-[680px] text-[17px] leading-relaxed text-ink-500">
          The mark is the face of a single jersey knit — columns of interlocking
          loops. It is the literal structure of the fabric this unit makes,
          rather than a generic abstract shape.
        </p>

        {/* lockups */}
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-ink-400">Lockups</h2>
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <div className="grid min-h-[180px] place-items-center rounded-2xl border border-sand-200 bg-white p-8">
            <span className="flex items-center gap-3">
              <Mark size={52} />
              <span className="leading-tight">
                <b className="block text-[23px] font-semibold tracking-[-0.01em] text-navy-800">CustomWear</b>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Tiruppur · Knitwear</span>
              </span>
            </span>
          </div>
          <div className="grid min-h-[180px] place-items-center rounded-2xl bg-navy-900 p-8">
            <span className="flex items-center gap-3">
              <MarkLight size={52} />
              <span className="leading-tight">
                <b className="block text-[23px] font-semibold tracking-[-0.01em] text-white">CustomWear</b>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f93ae]">Tiruppur · Knitwear</span>
              </span>
            </span>
          </div>
        </div>

        {/* scale test */}
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-ink-400">Mark at size</h2>
        <div className="mb-10 flex flex-wrap items-end gap-6 rounded-2xl border border-sand-200 bg-white p-7">
          {[16, 24, 32, 48, 72, 104].map((s) => (
            <div key={s} className="text-center">
              <Mark size={s} />
              <div className="mt-2 text-[11px] text-ink-400">{s}px</div>
            </div>
          ))}
        </div>

        {/* colours */}
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-ink-400">Colour</h2>
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLOURS.map(([name, hex, use]) => (
            <div key={name} className="overflow-hidden rounded-xl border border-sand-200 bg-white">
              <div className="h-16" style={{ background: hex }} />
              <div className="p-3">
                <div className="text-[13.5px] font-semibold text-navy-800">{name}</div>
                <div className="font-mono text-[12px] uppercase text-ink-400">{hex}</div>
                <div className="mt-1 text-[11.5px] leading-snug text-ink-400">{use}</div>
              </div>
            </div>
          ))}
        </div>

        {/* files */}
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-ink-400">Files</h2>
        <div className="mb-10 overflow-hidden rounded-2xl border border-sand-200 bg-white">
          {FILES.map(([f, use], i) => (
            <a key={f} href={`/brand/${f}`} target="_blank" rel="noreferrer"
              className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition hover:bg-sand-50 ${i > 0 ? "border-t border-sand-100" : ""}`}>
              <span className="font-mono text-[13px] text-navy-800">{f}</span>
              <span className="text-[13px] text-ink-400">{use}</span>
              <span className="ml-auto text-[12.5px] font-semibold text-gold-500">open →</span>
            </a>
          ))}
        </div>

        {/* banners */}
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-ink-400">Banner photography</h2>
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BANNERS.map(([f, use]) => (
            <div key={f} className="overflow-hidden rounded-xl border border-sand-200 bg-white">
              <div className="relative aspect-[3/1] bg-sand-100">
                <Image src={`/banners/${f}`} alt="" fill sizes="400px" className="object-cover" />
              </div>
              <div className="p-3">
                <div className="font-mono text-[12px] text-navy-800">{f}</div>
                <div className="text-[12px] text-ink-400">{use}</div>
              </div>
            </div>
          ))}
        </div>

        <Notice>
          <strong>These banners are AI-generated material photography.</strong>{" "}
          They sit decoratively behind page headings and are never captioned as
          this unit&apos;s premises, equipment or output. Anything claiming to
          show the actual factory, team or finished orders must be a real
          photograph — those slots are on <code>/work</code> and are
          deliberately still empty.
        </Notice>

        <div className="mt-4 rounded-xl border border-sand-200 bg-white p-5 text-[14px] leading-relaxed text-ink-500">
          <strong className="text-navy-800">Before sending to a printer:</strong>{" "}
          the wordmark uses live text with an Inter / Helvetica fallback.
          Convert text to outlines before handing files to a press or signage
          vendor, or they will substitute a font. The mark itself is pure
          geometry and needs no conversion.
        </div>
      </Wrap>
    </section>
  );
}
