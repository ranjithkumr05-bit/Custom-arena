import Link from "next/link";
import { Btn, SectionHead, Wrap } from "./ui";

/**
 * Sets expectations for the whole engagement before the buyer commits to the
 * first step. Removes the main reason people bounce off a quote form: not
 * knowing what happens after they press send.
 */
const STEPS = [
  {
    n: "1",
    t: "Send your requirement",
    d: "Product, quantity and size breakdown through the quote builder, or just a message on WhatsApp. Partial information is fine — we'll ask for the rest.",
    time: "2 minutes",
  },
  {
    n: "2",
    t: "We confirm the spec and rate",
    d: "We come back with a firm rate, the fabric we'd recommend and a realistic timeline. If something you've asked for won't work, we say so at this stage rather than later.",
    time: "same or next day",
  },
  {
    n: "3",
    t: "Approve a sample",
    d: "For most orders we make a sample first so fit, colour and branding are confirmed against something physical. Nothing goes to bulk on an assumption.",
    time: "before bulk",
    link: { href: "/quote?kind=sample", label: "Request a sample" },
  },
  {
    n: "4",
    t: "Production and dispatch",
    d: "You get a reference number and can check the production stage on the tracking page at any time, without messaging to ask.",
    time: "tracked throughout",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 lg:py-20">
      <Wrap>
        <SectionHead
          eyebrow="How ordering works"
          title="Four steps, no surprises"
          lead="So you know exactly what happens after you press send — and where you can still change your mind."
        />

        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.n} className="relative rounded-2xl border border-sand-200 bg-white p-6">
              {i < STEPS.length - 1 && (
                <span aria-hidden className="absolute -right-2 top-11 hidden text-gold-300 lg:block">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </span>
              )}
              <div className="mb-3 flex items-center gap-2.5">
                <b className="grid size-8 place-items-center rounded-lg bg-navy-800 text-[14px] font-bold text-gold-400">
                  {s.n}
                </b>
                <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-[11px] font-semibold text-ink-500">
                  {s.time}
                </span>
              </div>
              <h3 className="mb-2 text-[16.5px]">{s.t}</h3>
              <p className="text-[13.5px] leading-relaxed text-ink-500">{s.d}</p>
              {"link" in s && s.link && (
                <Link href={s.link.href}
                  className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-navy-800 underline decoration-gold-500 underline-offset-4">
                  {s.link.label}
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </Link>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Btn href="/quote" variant="navy" size="lg">Start step one</Btn>
          <span className="text-[14px] text-ink-400">
            No account needed. Nothing is charged at enquiry stage.
          </span>
        </div>
      </Wrap>
    </section>
  );
}
