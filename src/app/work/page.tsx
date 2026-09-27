import type { Metadata } from "next";
import { Btn, Notice, SectionHead, Wrap } from "@/components/ui";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Our Work — Production Photography",
  description:
    "Production photographs from our knitwear unit in Tiruppur. Real floor, real process, no stock imagery.",
};

const SLOTS = [
  ["Cutting", "Fabric laid out, pattern in progress", "Landscape"],
  ["Stitching floor", "Wide shot showing the scale of the line", "Landscape"],
  ["Branding", "Press or screen table with work on it", "Landscape"],
  ["Quality check", "Inspection table, garments being measured", "Landscape"],
  ["Finishing", "Pressed and folded, ready for packing", "Square"],
  ["Our people", "Faces build more trust than machines", "Landscape"],
];

export default function WorkPage() {
  return (
    <>
    <section className="py-16 lg:py-20">
      <Wrap>
        <SectionHead
          as="h1"
          eyebrow="Our work"
          title="Production photographs go here"
          lead="These slots are intentionally empty. Competitor sites in this sector fill theirs with stock photography and AI-generated factory images — buyers notice. Your own floor, photographed on a phone in daylight, will outperform all of it."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SLOTS.map(([title, desc, ratio]) => (
            <div key={title} className="overflow-hidden rounded-2xl border border-dashed border-sand-200 bg-sand-50">
              <div className="grid aspect-[4/3] place-items-center bg-[repeating-linear-gradient(45deg,#f2f0ea,#f2f0ea_12px,#ece9e1_12px,#ece9e1_24px)] p-5 text-center">
                <div>
                  <div className="text-[13px] font-medium text-ink-500">{desc}</div>
                  <div className="mt-1 text-[11.5px] uppercase tracking-wide text-ink-400">
                    {ratio} · real photo needed
                  </div>
                </div>
              </div>
              <div className="p-[18px]">
                <h3 className="mb-1 text-[15px]">{title}</h3>
                <p className="text-[13px] text-ink-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-[780px] space-y-5">
          <Notice>
            <strong>No client names appear anywhere on this site.</strong> Until
            you confirm which buyers have given permission to be named, work
            stays anonymised — described by category and scope, never by brand.
          </Notice>

          <div className="rounded-2xl border border-sand-200 bg-white p-6">
            <h3 className="mb-3 text-[17px]">Shooting these yourself</h3>
            <ul className="grid gap-2 text-[14.5px] leading-relaxed text-ink-500">
              <li>• Shoot between 9 and 11 AM with the shutters open — daylight only, no flash.</li>
              <li>• Tidy the frame first. Clear the floor, straighten the stacks.</li>
              <li>• Shoot landscape, hold steady, take five of each and keep the best.</li>
              <li>• No filters. Slightly raw and real beats polished and generic.</li>
              <li>• Include people working. Faces are the strongest trust signal you have.</li>
            </ul>
          </div>
        </div>

      </Wrap>
    </section>

    <NextStep
      title="Judge us on the work, not the website"
      body="Ask for a sample. It costs little, it arrives physically, and it tells you more than any photograph on any supplier's site."
      primary={{ href: "/quote", label: "Request a sample" }}
      secondary={{ href: "/contact", label: "Visit the unit" }}
    />
    </>
  );
}
