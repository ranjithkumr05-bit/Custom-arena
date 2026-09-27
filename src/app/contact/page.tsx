import type { Metadata } from "next";
import { Btn, Confirm, Notice, Wrap } from "@/components/ui";
import { SITE, isPublishable, waHref } from "@/lib/content";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Contact — Tiruppur Knitwear Unit",
  description:
    "Contact our knitwear manufacturing unit in Tiruppur, Tamil Nadu. WhatsApp, phone or the quote builder. Visitors welcome.",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-5 border-b border-sand-200 py-3.5">
      <dt className="text-[14px] text-ink-400">{label}</dt>
      <dd className="text-right text-[14.5px] font-medium text-navy-800">{value}</dd>
    </div>
  );
}

export default function ContactPage() {
  const c = SITE.contact;
  return (
    <>
    <PageHero
      banner="/banners/banner-editorial.jpg"
      eyebrow="Contact"
      title="Talk to the unit"
      crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
    />
    <section className="py-14 lg:py-16">
      <Wrap className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="mb-8 text-[17px] leading-relaxed text-ink-500">
            The fastest route is WhatsApp — send the product, quantity and a
            rough size split and we can usually give you a range the same day.
            For a structured enquiry with artwork, use the quote builder.
          </p>

          <div className="mb-8 flex flex-wrap gap-3">
            <Btn href={waHref()} variant="wa" size="lg" external>
              Message on WhatsApp
            </Btn>
            <Btn href="/quote" variant="navy" size="lg">Open quote builder</Btn>
          </div>

          <dl>
            <Row label="WhatsApp" value={isPublishable(c.whatsapp) ? c.whatsapp.value : <Confirm />} />
            <Row label="Phone" value={isPublishable(c.phone) ? c.phone.value : <Confirm />} />
            <Row label="Email" value={isPublishable(c.email) ? c.email.value : <Confirm />} />
            <Row label="Working hours" value={isPublishable(c.hours) ? c.hours.value : <Confirm />} />
            <Row
              label="Location"
              value={
                isPublishable(SITE.location.addressLine)
                  ? SITE.location.addressLine.value
                  : <>{SITE.location.city}, {SITE.location.state} <Confirm label="full address" /></>
              }
            />
          </dl>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-navy-800 p-7 text-[#c9d4e4]">
            <h2 className="mb-3 text-[20px] text-white">Visit the floor</h2>
            <p className="mb-4 text-[15px] leading-relaxed text-[#9fb0c7]">
              We are in Tiruppur and visitors are welcome. If you are
              evaluating suppliers, seeing the unit answers more in ten minutes
              than any website can in an hour — including the questions you
              would not think to ask over a call.
            </p>
            <p className="text-[14px] leading-relaxed text-[#7f93ae]">
              Message ahead so someone who can answer technical questions is on
              the floor when you arrive.
            </p>
          </div>

          <div className="rounded-2xl border border-sand-200 bg-sand-50 p-6">
            <h3 className="mb-3 text-[16px]">What to send with an enquiry</h3>
            <ul className="grid gap-2 text-[14px] leading-relaxed text-ink-500">
              <li>• Product and rough quantity</li>
              <li>• Size breakdown if you have it</li>
              <li>• Artwork, or a reference image</li>
              <li>• Colour reference</li>
              <li>• The date you need it by</li>
              <li>• Delivery city</li>
            </ul>
            <p className="mt-4 text-[13px] text-ink-400">
              Partial information is fine — we will ask for the rest.
            </p>
          </div>

          <Notice>
            <strong>Contact details are placeholders.</strong> Real number,
            email, address and working hours go into{" "}
            <code>content/site.json</code> and appear everywhere automatically.
          </Notice>
        </aside>
      </Wrap>
    </section>
    </>
  );
}
