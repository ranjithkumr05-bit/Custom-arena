"use client";

import { useState } from "react";
import { Wrap } from "@/components/ui";
import { Dialog, Menu, Sheet, Tooltip } from "@/components/kit/overlays";
import { Accordion, Avatar, Badge, Segmented, Spinner, Stepper, Switch, Tabs } from "@/components/kit/controls";
import { useToast } from "@/components/kit/Toast";
import { BackBarUI } from "@/components/BackBar";

function Row({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-sand-200 py-8 last:border-0">
      <h2 className="mb-1 text-[18px]">{title}</h2>
      <p className="mb-5 max-w-[680px] text-[14px] leading-relaxed text-ink-500">{note}</p>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

const btn = "inline-flex min-h-[42px] items-center rounded-md border border-sand-200 px-4 text-[14px] font-semibold text-navy-800 transition hover:border-gold-400";

export default function UiKit() {
  const toast = useToast();
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [seg, setSeg] = useState<"quote" | "sample">("quote");
  const [sw1, setSw1] = useState(true);
  const [sw2, setSw2] = useState(false);
  const [step, setStep] = useState(1);

  return (
    <>
      <BackBarUI href="/" label="Home" here="UI kit" />
      <section className="py-12">
        <Wrap className="max-w-[900px]">
          <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-500">Internal reference</p>
          <h1 className="mb-3 text-[clamp(28px,4vw,40px)]">UI kit</h1>
          <p className="mb-2 max-w-[700px] text-[16.5px] leading-relaxed text-ink-500">
            Every primitive is hand-built — no Radix, no Headless UI, no Framer
            Motion. Together they add roughly 9&nbsp;KB gzipped instead of the
            ~60&nbsp;KB those three would.
          </p>
          <p className="mb-9 max-w-[700px] text-[14px] leading-relaxed text-ink-400">
            All of them: portalled where needed, focus-trapped, keyboard
            navigable, ARIA-correct, and silent under
            <code className="mx-1 rounded bg-sand-100 px-1 py-0.5 text-[12.5px]">prefers-reduced-motion</code>.
            Try them with the keyboard only.
          </p>

          <Row title="Menu" note="Portalled so it escapes overflow:hidden. Flips above the trigger near the viewport edge, shifts to stay on screen. One tab stop, arrow keys inside, and typeahead — press “s” with it open.">
            <Menu
              width={250}
              header={<p className="text-[12.5px] text-ink-500">Signed in as <b className="text-navy-800">Priya R</b></p>}
              items={[
                { label: "My orders", hint: "3 in progress", onSelect: () => toast.success("Menu item selected") },
                { label: "Reorder CA-2609-0001", hint: "256 pieces", onSelect: () => toast.show({ tone: "info", title: "Reorder started" }) },
                { label: "Settings", onSelect: () => {} },
                { label: "Sign out", danger: true, separatorBefore: true, onSelect: () => toast.error("Signed out", "Demo only.") },
              ]}
              trigger={({ open, toggle, ref }) => (
                <button ref={ref} onClick={toggle} aria-haspopup="menu" aria-expanded={open} className={btn}>
                  Open menu ▾
                </button>
              )}
            />
            <Tooltip label="Tooltips open on hover AND on keyboard focus, and close on Escape. Most implementations skip both.">
              <span className={btn}>Hover or focus me</span>
            </Tooltip>
          </Row>

          <Row title="Dialog & Sheet" note="Focus is trapped inside and restored to the trigger on close — the half most implementations skip, which strands keyboard users at the top of the document. Body scroll locks without the layout shifting as the scrollbar disappears.">
            <button className={btn} onClick={() => setDialog(true)}>Open dialog</button>
            <button className={btn} onClick={() => setSheet(true)}>Open bottom sheet</button>
          </Row>

          <Row title="Toasts" note="Timer pauses on hover and on focus — a toast that vanishes while you reach for Undo is worse than none. Errors never auto-dismiss. Live region is polite for success, assertive for errors.">
            <button className={btn} onClick={() => toast.success("Quote sent", "Reference CA-2609-0042.")}>Success</button>
            <button className={btn} onClick={() => toast.error("Could not send", "Check your connection and try again.")}>Error (sticky)</button>
            <button className={btn} onClick={() => toast.show({ tone: "info", title: "Draft saved", body: "Hover to pause the timer.", action: { label: "Undo", onClick: () => toast.success("Restored") } })}>
              With action
            </button>
          </Row>

          <Row title="Tabs" note="Roving tabindex: the whole list is one tab stop, arrows move between tabs, Home/End jump to the ends. The underline animates to the selected tab by measuring it, so it works at any label width.">
            <div className="w-full">
              <Tabs
                tabs={[
                  { id: "a", label: "Overview", content: <p className="text-[14.5px] text-ink-500">Arrow keys move between tabs. Home and End jump to either end.</p> },
                  { id: "b", label: "Inbox", badge: 9, content: <p className="text-[14.5px] text-ink-500">Badges accept a number or a string.</p> },
                  { id: "c", label: "Pipeline", content: <p className="text-[14.5px] text-ink-500">Panels mount only when selected.</p> },
                ]}
              />
            </div>
          </Row>

          <Row title="Accordion" note="Height animates from a measured value, not a magic max-height, so it is correct at any content length. A ResizeObserver keeps it right if the content reflows on resize or after fonts load.">
            <div className="w-full">
              <Accordion
                multiple
                items={[
                  { id: "1", title: "Why measure instead of max-height?", content: "A large max-height makes the easing wrong — the visible part finishes early and the rest is dead time. Measuring gives a true duration." },
                  { id: "2", title: "What about content that changes size?", content: "A ResizeObserver on the inner element updates the stored height, so responsive reflow and late font loads do not clip the panel." },
                  { id: "3", title: "Is it accessible?", content: "Button carries aria-expanded and aria-controls; the panel is a labelled region. Under reduced motion it snaps instead of animating." },
                ]}
              />
            </div>
          </Row>

          <Row title="Segmented, Switch, Stepper" note="The segmented pill and the tab underline both animate by measuring the target element, so neither breaks when labels are translated or the font changes.">
            <div className="grid w-full gap-6">
              <Segmented value={seg} onChange={setSeg} options={[{ value: "quote", label: "Bulk quote" }, { value: "sample", label: "Sample first" }]} />
              <div className="grid max-w-[420px] gap-3.5">
                <Switch checked={sw1} onChange={setSw1} label="Show category" hint="Hidden categories drop out of the sitemap and search index too." />
                <Switch checked={sw2} onChange={setSw2} label="Notify on WhatsApp" hint="Sends a message when the status changes." />
              </div>
              <div>
                <Stepper steps={["Requirement", "Rate confirmed", "Sample", "Production"]} current={step} />
                <div className="mt-3 flex gap-2">
                  <button className={btn} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</button>
                  <button className={btn} onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</button>
                </div>
              </div>
            </div>
          </Row>

          <Row title="Avatar, Badge, Spinner" note="Avatar derives a deterministic hue from the name, so the same person is always the same colour without storing one.">
            <div className="flex flex-wrap items-center gap-3">
              {["Priya Raman", "Arun Kumar", "Meera Nair", "9876543210"].map((n) => <Avatar key={n} name={n} size={40} />)}
              <Badge>new</Badge>
              <Badge tone="gold">high value</Badge>
              <Badge tone="good">dispatched</Badge>
              <Badge tone="bad">lost</Badge>
              <span className="text-navy-800"><Spinner /></span>
            </div>
          </Row>
        </Wrap>
      </section>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Confirm this specification"
        description="Once approved, bulk production runs against exactly this spec."
        footer={
          <>
            <button className={btn} onClick={() => setDialog(false)}>Cancel</button>
            <button
              className="inline-flex min-h-[42px] items-center rounded-md bg-navy-800 px-5 text-[14px] font-semibold text-white"
              onClick={() => { setDialog(false); toast.success("Specification approved"); }}
            >
              Approve
            </button>
          </>
        }
      >
        <p className="text-[14.5px] leading-relaxed text-ink-500">
          Press <kbd className="rounded border border-sand-200 bg-sand-50 px-1.5 py-0.5 font-sans text-[12px]">Tab</kbd> repeatedly
          — focus cycles inside this dialog and cannot escape to the page behind.
          Press <kbd className="rounded border border-sand-200 bg-sand-50 px-1.5 py-0.5 font-sans text-[12px]">Esc</kbd> and
          focus returns to the button that opened it.
        </p>
      </Dialog>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filter categories">
        <p className="mb-4 text-[14.5px] leading-relaxed text-ink-500">
          Bottom sheets suit one-handed phone use — the controls sit where the
          thumb already is. Padded for the iPhone home indicator with
          <code className="mx-1 rounded bg-sand-100 px-1 py-0.5 text-[12.5px]">env(safe-area-inset-bottom)</code>.
        </p>
        <button className={btn} onClick={() => setSheet(false)}>Apply</button>
      </Sheet>
    </>
  );
}
