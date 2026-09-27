"use client";

import Link from "next/link";
import { useState } from "react";
import { PRICING, SITE } from "@/lib/content";
import { readAttribution } from "@/lib/marketing";
import ArtworkUpload, { type Uploaded } from "./ArtworkUpload";
import { track } from "./Analytics";

/**
 * The default enquiry form.
 *
 * The detailed builder asked for 11 required fields — including fabric and
 * branding method, which most buyers genuinely do not know, and seven size
 * boxes — before anyone could ask "what would 100 polos cost?". That is a
 * specification tool being used as a first contact.
 *
 * This asks four things. Fabric, branding, colour and the size breakdown are
 * all conversations we can have after we know who is calling and roughly
 * what they want. The detailed builder is still one click away for buyers
 * who already know their spec and want an accurate rate first time.
 */

const PRODUCTS = Object.entries(PRICING.product).map(([k, v]) => ({ k, label: v.label }));

const BRANDING = [
  { id: "print",      label: "Printed",        hint: "screen, DTF or DTG", wa: "printed",           deco: "dtf" },
  { id: "embroidery", label: "Embroidered",    hint: "thread, raised",     wa: "embroidered",       deco: "embroidery" },
  { id: "both",       label: "Both",           hint: "print + embroidery", wa: "print + embroidery",deco: "embroidery" },
  { id: "none",       label: "Plain",          hint: "no branding",        wa: "plain, no branding",deco: "none" },
  { id: "unsure",     label: "Not sure",       hint: "we'll advise",       wa: "to be advised",     deco: "dtf" },
] as const;

const field =
  "min-h-[50px] w-full rounded-lg border border-sand-200 px-4 text-[16px] text-ink-700 transition focus:border-navy-600 focus:outline-none focus:ring-[3px] focus:ring-navy-600/12";

export default function SimpleQuote({
  initialProduct,
  initialKind = "quote",
  onSwitchToDetailed,
}: {
  initialProduct?: string;
  initialKind?: "quote" | "sample";
  onSwitchToDetailed: () => void;
}) {
  // Sample vs bulk is a decision the buyer makes here, not something they
  // should have to arrive with. Reaching it only by deep link meant anyone
  // landing on /quote directly could not ask for one.
  const [kind, setKind] = useState<"quote" | "sample">(initialKind);
  const [product, setProduct] = useState(initialProduct ?? "tee");
  const [otherText, setOtherText] = useState("");
  const [qty, setQty] = useState("");
  const [branding, setBranding] = useState<"print" | "embroidery" | "both" | "none" | "unsure">("unsure");
  const [form, setForm] = useState({ name: "", phone: "", city: "", notes: "" });
  const [artwork, setArtwork] = useState<Uploaded[]>([]);
  const [uploadToken] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  );

  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [ref, setRef] = useState("");
  const [err, setErr] = useState("");

  const n = parseInt(qty, 10) || 0;
  const isSample = kind === "sample";
  const min = isSample ? 75 : PRICING.moq;

  const waText = [
    isSample ? "Hi, I would like a sample." : "Hi, I would like a quote.",
    "",
    `Product: ${product === "other" ? otherText || "something else" : PRICING.product[product as keyof typeof PRICING.product]?.label}`,
    `Quantity: ${n || "?"}`,
    `Branding: ${BRANDING.find((b) => b.id === branding)?.wa}`,
    form.city ? `Delivery city: ${form.city}` : "",
    form.notes ? `\n${form.notes}` : "",
  ].filter(Boolean).join("\n");
  const waLink = `https://wa.me/${SITE.contact.whatsapp.value}?text=${encodeURIComponent(waText)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (n < min) {
      setErr(isSample
        ? `We make samples for orders of 75 pieces and above. Enter your expected order size, or switch to a bulk quote.`
        : `Please enter a quantity of at least ${min}.`);
      return;
    }
    if (product === "other" && !otherText.trim()) {
      setErr("Tell us what you need made."); return;
    }
    if (!form.name.trim()) { setErr("Please tell us your name."); return; }
    if (!form.phone.trim()) { setErr("We need a phone number to reply to."); return; }

    setState("sending");
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: form.name,
          phone: form.phone,
          city: form.city,
          // Flagged so the admin can see at a glance that fabric, branding
          // and sizes were never asked for — they are not missing data.
          notes: [
            "[Quick enquiry — fabric and size breakdown to be confirmed]",
            product === "other" && otherText ? `Product asked for: ${otherText}` : "",
            `Branding: ${BRANDING.find((b) => b.id === branding)?.wa}`,
            form.notes,
          ].filter(Boolean).join("\n"),
          attribution: readAttribution(),
          uploadToken,
          attachmentIds: artwork.map((a) => a.id),
          lines: [{
            product,
            fabric: "single-jersey",
            decoration: BRANDING.find((b) => b.id === branding)?.deco ?? "dtf",
            positions: 1,
            colour: "",
            sizes: {},
            qty: n,
            est_low: 0,
            est_high: 0,
          }],
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error ?? "Something went wrong"); setState("idle"); return; }
      track("generate_lead", { quantity: n, lead_type: kind, detail: "simple" });
      setRef(json.ref);
      setState("done");
    } catch {
      setErr("Network error — please try again, or message us on WhatsApp.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="mx-auto max-w-[560px] rounded-2xl border border-sand-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-gold-50">
          <svg viewBox="0 0 24 24" className="size-7 text-gold-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m4 12.5 5 5L20 6.5" />
          </svg>
        </div>
        <h3 className="mb-2 text-[24px]">Got it</h3>
        <p className="mb-1 text-[15px] text-ink-500">Your reference is</p>
        <p className="mb-5 text-[28px] font-bold tracking-tight text-navy-800">{ref}</p>
        <p className="mx-auto mb-7 max-w-[420px] text-[14.5px] leading-relaxed text-ink-500">
          We will come back with a rate and the fabric we would recommend.
          Save the reference — you can check it on the Track Order page.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-[46px] items-center rounded-md bg-[#1faa52] px-5 text-[14.5px] font-semibold text-white">
            Send on WhatsApp too
          </a>
          <Link href={`/track?ref=${ref}`}
            className="inline-flex min-h-[46px] items-center rounded-md border border-sand-200 px-5 text-[14.5px] font-semibold text-navy-800">
            Track this
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[620px]">
      <form onSubmit={submit} noValidate className="rounded-2xl border border-sand-200 bg-white p-6 shadow-md sm:p-8">
        <div className="grid gap-5">
          <div>
            <span className="mb-2 block text-[14px] font-semibold text-navy-800">
              What are you after?
            </span>
            <div className="flex gap-2">
              {([["quote", "A bulk quote", `${PRICING.moq}+ pieces`], ["sample", "A sample first", "for orders 75+"]] as const).map(
                ([v, label, hint]) => (
                  <button key={v} type="button" onClick={() => setKind(v)}
                    className={`min-h-[56px] flex-1 rounded-lg border px-3 text-left transition ${
                      kind === v ? "border-navy-800 bg-navy-800 text-white" : "border-sand-200 text-ink-500 hover:border-navy-600"
                    }`}>
                    <span className="block text-[14px] font-semibold">{label}</span>
                    <span className={`block text-[12px] ${kind === v ? "text-[#9fb0c7]" : "text-ink-400"}`}>{hint}</span>
                  </button>
                )
              )}
            </div>
          </div>

          <label>
            <span className="mb-1.5 block text-[14px] font-semibold text-navy-800">
              What do you need?
            </span>
            <select className={field} value={product} onChange={(e) => setProduct(e.target.value)}>
              {PRODUCTS.map((p) => <option key={p.k} value={p.k}>{p.label}</option>)}
            </select>
          </label>

          {product === "other" && (
            <label>
              <span className="mb-1.5 block text-[14px] font-semibold text-navy-800">
                Tell us what it is
              </span>
              <input
                className={field}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="e.g. track pants, caps, aprons, a reference garment…"
              />
              <span className="mt-1.5 block text-[12px] leading-relaxed text-ink-400">
                We work in knitted fabric only. If it is not a knit we will say
                so rather than take the order and subcontract it.
              </span>
            </label>
          )}

          <label>
            <span className="mb-1.5 block text-[14px] font-semibold text-navy-800">
              {isSample ? "How big is the full order?" : "Roughly how many?"}
              <span className="ml-1.5 font-normal text-ink-400">
                {isSample ? "samples are for orders of 75+" : `minimum ${PRICING.moq}`}
              </span>
            </span>
            <input
              type="number" inputMode="numeric" min={min} value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={isSample ? "e.g. 150" : "e.g. 100"}
              className={`no-spin ${field}`}
            />
          </label>

          <fieldset className="border-0 p-0">
            <legend className="mb-2 text-[14px] font-semibold text-navy-800">
              Printing or embroidery?
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BRANDING.map((b) => (
                <button key={b.id} type="button" onClick={() => setBranding(b.id)}
                  className={`min-h-[56px] rounded-lg border px-2 py-2 text-left transition ${
                    branding === b.id
                      ? "border-navy-800 bg-navy-800 text-white"
                      : "border-sand-200 text-ink-500 hover:border-navy-600"
                  }`}>
                  <span className="block text-[14px] font-semibold">{b.label}</span>
                  <span className={`block text-[11.5px] leading-snug ${branding === b.id ? "text-[#9fb0c7]" : "text-ink-400"}`}>
                    {b.hint}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-400">
              Screen print is priced per colour, embroidery by stitch count — so
              this changes the rate. Pick &ldquo;Not sure&rdquo; and we will
              recommend one from your artwork.
            </p>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-[14px] font-semibold text-navy-800">Your name</span>
              <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              <span className="mb-1.5 block text-[14px] font-semibold text-navy-800">Phone / WhatsApp</span>
              <input type="tel" inputMode="tel" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
          </div>

          <details className="group rounded-lg border border-sand-200 bg-sand-50 px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[13.5px] font-semibold text-navy-800 [&::-webkit-details-marker]:hidden">
              Add city, artwork or a note
              <span className="text-[18px] leading-none text-gold-500 transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-4 grid gap-4">
              <label>
                <span className="mb-1.5 block text-[13px] font-semibold text-navy-800">Delivery city</span>
                <input className={`${field} min-h-[44px] text-[15px]`} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </label>
              {branding !== "none" && (
                <div>
                  <span className="mb-1.5 block text-[13px] font-semibold text-navy-800">Your logo or artwork</span>
                  <ArtworkUpload token={uploadToken} files={artwork} onChange={setArtwork} />
                </div>
              )}
              <label>
                <span className="mb-1.5 block text-[13px] font-semibold text-navy-800">Anything else</span>
                <textarea rows={3} className={`${field} min-h-[80px] resize-y py-2.5 text-[15px]`}
                  placeholder="Colour, deadline, a reference garment you like…"
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
            </div>
          </details>

          {err && (
            <p className="rounded-lg border border-[#e5b4a2] bg-[#fdefe9] px-4 py-3 text-[14px] font-medium text-[#a6431f]">
              {err}
            </p>
          )}

          <button type="submit" disabled={state === "sending"}
            className="min-h-[54px] w-full rounded-lg bg-navy-800 text-[16px] font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60">
            {state === "sending" ? "Sending…" : isSample ? "Request a sample" : "Send enquiry"}
          </button>

          <div className="flex items-center gap-3 text-[12.5px] text-ink-400">
            <span className="h-px flex-1 bg-sand-200" />or<span className="h-px flex-1 bg-sand-200" />
          </div>

          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="grid min-h-[50px] place-items-center rounded-lg bg-[#1faa52] text-[15px] font-semibold text-white transition hover:bg-[#1a9147]">
            Message us on WhatsApp
          </a>
        </div>
      </form>

      <div className="mt-4 rounded-2xl border border-sand-200 bg-sand-50 p-5 text-center">
        <p className="mb-1 text-[14.5px] font-semibold text-navy-800">
          Already know your sizes and colours?
        </p>
        <p className="mb-3.5 text-[13.5px] leading-relaxed text-ink-500">
          The detailed builder takes a per-size breakdown and lets you add
          several products at once — so the rate comes back right first time.
        </p>
        <button onClick={onSwitchToDetailed}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-sand-200 bg-white px-5 text-[14px] font-semibold text-navy-800 transition hover:border-gold-400">
          Open the detailed builder
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
