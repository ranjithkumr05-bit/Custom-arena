"use client";

import { useMemo, useState } from "react";
import { PRICING, SITE } from "@/lib/content";
import { MOQ, SIZES, calculate, inr } from "@/lib/pricing";

const PRODUCTS = Object.entries(PRICING.product).map(([k, v]) => ({ k, label: v.label }));
const FABRICS = Object.entries(PRICING.fabric).map(([k, v]) => ({ k, label: v.label }));
const DECOS = Object.entries(PRICING.decoration).map(([k, v]) => ({ k, label: v.label }));

const BUYERS = [
  "Company / corporate",
  "School or college",
  "Sports team or club",
  "Event organiser",
  "Retailer / reseller",
  "Brand / private label",
];

const field =
  "min-h-[44px] rounded-md border border-sand-200 px-3 py-2.5 text-[14.5px] text-ink-700 transition focus:border-navy-600 focus:outline-none focus:ring-[3px] focus:ring-navy-600/12";

function Label({ children, opt }: { children: React.ReactNode; opt?: boolean }) {
  return (
    <span className="text-[13px] font-semibold text-navy-800">
      {children}
      {opt && <span className="font-normal text-ink-400"> — optional</span>}
    </span>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="mb-3.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-gold-500">
      {children}
    </legend>
  );
}

export default function QuoteForm({ initialProduct }: { initialProduct?: string }) {
  const [product, setProduct] = useState(initialProduct ?? "tee");
  const [fabric, setFabric] = useState("single-jersey");
  const [decoration, setDecoration] = useState("dtf");
  const [positions, setPositions] = useState(1);
  const [sizes, setSizes] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    name: "", organisation: "", phone: "", email: "", city: "",
    buyerType: BUYERS[0], colour: "", requiredBy: "", notes: "",
  });

  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [ref, setRef] = useState("");
  const [err, setErr] = useState("");

  const result = useMemo(
    () => calculate({ product, fabric, decoration, positions, sizes }),
    [product, fabric, decoration, positions, sizes]
  );

  const sizeSummary = SIZES.filter((s) => sizes[s] > 0)
    .map((s) => `${s}:${sizes[s]}`)
    .join(", ");

  const waMessage = [
    "Hi, I would like a quote.", "",
    `Product: ${PRICING.product[product as keyof typeof PRICING.product]?.label ?? product}`,
    `Fabric: ${PRICING.fabric[fabric as keyof typeof PRICING.fabric]?.label ?? fabric}`,
    `Quantity: ${result.qty} pcs`,
    `Sizes: ${sizeSummary}`,
    `Branding: ${decoration === "none" ? "None" : `${decoration.toUpperCase()} x ${positions}`}`,
    `Delivery city: ${form.city}`, "",
    "Please confirm rate and timeline.",
  ].join("\n");

  const waLink = `https://wa.me/${SITE.contact.whatsapp.value}?text=${encodeURIComponent(waMessage)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (result.qty < MOQ) {
      setErr(`Minimum order is ${MOQ} pieces. Your breakdown totals ${result.qty}.`);
      return;
    }
    if (!form.name.trim() || !form.phone.trim()) {
      setErr("Please enter your name and phone number.");
      return;
    }

    setState("sending");
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, product, fabric, decoration, positions, sizes,
          qty: result.qty,
          estimateLow: Math.round(result.unitLow),
          estimateHigh: Math.round(result.unitHigh),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setRef(json.ref);
      setState("done");
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-8 shadow-md">
        <div className="mb-4 inline-flex rounded-full bg-gold-50 px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-[#8a6d1f]">
          Request received
        </div>
        <h3 className="text-[24px]">Your reference is {ref}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
          Save this reference — you can use it on the Track Order page. Your
          request has been recorded and, if an automation webhook is configured,
          forwarded to the team.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-md bg-[#1faa52] px-5 text-[14.5px] font-semibold text-white"
          >
            Send the details on WhatsApp too
          </a>
          <a
            href="/track"
            className="inline-flex min-h-[44px] items-center rounded-md border border-sand-200 px-5 text-[14.5px] font-semibold text-navy-800"
          >
            Track this order
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.55fr_1fr]">
      {/* ---------- FORM ---------- */}
      <form
        onSubmit={submit}
        className="rounded-2xl border border-sand-200 bg-white p-6 shadow-md sm:p-8"
        noValidate
      >
        <fieldset className="mb-6 border-0 p-0">
          <Legend>1 · What you need</Legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <Label>Product</Label>
              <select className={field} value={product} onChange={(e) => setProduct(e.target.value)}>
                {PRODUCTS.map((p) => <option key={p.k} value={p.k}>{p.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <Label>Fabric</Label>
              <select className={field} value={fabric} onChange={(e) => setFabric(e.target.value)}>
                {FABRICS.map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="mb-6 border-0 p-0">
          <Legend>2 · Size breakdown</Legend>
          <div className="grid grid-cols-4 gap-2 rounded-lg border border-sand-200 bg-sand-50 p-3.5 sm:grid-cols-7">
            {SIZES.map((s) => (
              <label key={s} className="flex flex-col gap-1.5">
                <span className="text-center text-[11.5px] font-bold tracking-wide text-navy-800">{s}</span>
                <input
                  type="number" min={0} inputMode="numeric" placeholder="0"
                  className={`no-spin min-h-[44px] rounded-md border px-1 py-2 text-center text-[15px] font-semibold text-navy-800 transition focus:outline-none focus:ring-[3px] focus:ring-gold-500/20 ${
                    sizes[s] > 0 ? "border-gold-300 bg-gold-50" : "border-sand-200 bg-white"
                  }`}
                  value={sizes[s] ?? ""}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setSizes((prev) => ({ ...prev, [s]: Number.isNaN(v) || v < 0 ? 0 : v }));
                  }}
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[13.5px] text-ink-500">
            <span className={result.belowMoq ? "font-semibold text-[#a6431f]" : ""}>
              {result.belowMoq
                ? `Below minimum — add ${MOQ - result.qty} more`
                : `Minimum order ${MOQ} pieces`}
            </span>
            <span>Total: <b className="text-[16px] text-navy-800">{result.qty}</b> pcs</span>
          </div>
        </fieldset>

        <fieldset className="mb-6 border-0 p-0">
          <Legend>3 · Branding</Legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <Label>Method</Label>
              <select className={field} value={decoration} onChange={(e) => setDecoration(e.target.value)}>
                {DECOS.map((d) => <option key={d.k} value={d.k}>{d.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <Label>Print positions</Label>
              <select className={field} value={positions} onChange={(e) => setPositions(+e.target.value)}>
                <option value={1}>1 — chest</option>
                <option value={2}>2 — chest + back</option>
                <option value={3}>3 — chest, back, sleeve</option>
                <option value={4}>4 or more</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <Label>Colour requirement</Label>
              <input className={field} placeholder="e.g. navy, or a brand colour code"
                value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <Label opt>Artwork</Label>
              <input type="file" accept=".png,.jpg,.jpeg,.pdf,.ai,.cdr" className={`${field} py-2`} />
            </label>
          </div>
        </fieldset>

        <fieldset className="mb-6 border-0 p-0">
          <Legend>4 · About you</Legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <Label>Your name</Label>
              <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <Label>Organisation</Label>
              <input className={field} value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
            </label>
          </div>
          <div className="mt-3.5 grid gap-3.5 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <Label>Phone / WhatsApp</Label>
              <input type="tel" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <Label opt>Email</Label>
              <input type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <Label>Delivery city</Label>
              <input className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
          </div>
          <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <Label>Buyer type</Label>
              <select className={field} value={form.buyerType} onChange={(e) => setForm({ ...form, buyerType: e.target.value })}>
                {BUYERS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <Label opt>Required by</Label>
              <input type="date" className={field} value={form.requiredBy} onChange={(e) => setForm({ ...form, requiredBy: e.target.value })} />
            </label>
          </div>
          <label className="mt-3.5 flex flex-col gap-1.5">
            <Label opt>Anything else</Label>
            <textarea
              className={`${field} min-h-[84px] resize-y`}
              placeholder="Specific GSM, packing requirement, label instructions, repeat of a previous order…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
        </fieldset>

        {err && (
          <p className="mb-4 rounded-md border border-[#e5b4a2] bg-[#fdefe9] px-4 py-3 text-[13.5px] font-medium text-[#a6431f]">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={state === "sending"}
          className="min-h-[52px] w-full rounded-md bg-navy-800 px-6 text-[15.5px] font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Send quote request"}
        </button>
      </form>

      {/* ---------- ESTIMATE ---------- */}
      <aside
        aria-live="polite"
        className="rounded-2xl bg-navy-800 p-6 text-[#c9d4e4] shadow-lg lg:sticky lg:top-[92px]"
      >
        <h3 className="text-[17px] text-white">Indicative estimate</h3>
        <p className="mb-5 mt-1 text-[13px] text-[#8ea0b9]">Updates as you fill the form</p>

        {result.breakdown.length > 0 ? (
          result.breakdown.map((b) => (
            <div key={b.label} className="flex justify-between gap-3 border-b border-white/8 py-2.5 text-[13.5px]">
              <span className="text-[#8ea0b9]">{b.label}</span>
              <span className="text-right font-semibold text-[#e3e9f2]">{b.value}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between gap-3 border-b border-white/8 py-2.5 text-[13.5px]">
            <span className="text-[#8ea0b9]">Quantity</span>
            <span className="font-semibold text-[#e3e9f2]">{result.qty} pcs</span>
          </div>
        )}

        <div className="mt-5 border-t border-white/18 pt-5">
          <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-gold-400">
            Estimated rate per piece
          </div>
          <div className="my-1.5 text-[30px] font-bold tracking-tight text-white">
            {result.slab ? `${inr(result.unitLow)} – ${inr(result.unitHigh)}` : "—"}
          </div>
          <div className="text-[13px] text-[#8ea0b9]">
            {result.slab
              ? `order total approx ${inr(result.orderLow)} – ${inr(result.orderHigh)}`
              : result.belowMoq
                ? `Minimum order is ${MOQ} pieces`
                : "Enter a size breakdown to calculate"}
          </div>
          {result.setup > 0 && result.slab && (
            <div className="mt-1 text-[12px] text-[#7f93ae]">
              includes one-time setup {inr(result.setup)}
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-2.5">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="grid min-h-[44px] place-items-center rounded-md bg-[#1faa52] text-[14.5px] font-semibold text-white transition hover:bg-[#1a9147]"
          >
            Send this on WhatsApp
          </a>
        </div>

        {!result.configured && (
          <p className="mt-4 border-t border-white/8 pt-3.5 text-[11.5px] leading-relaxed text-[#7f93ae]">
            <strong className="text-gold-300">Rates here are placeholders.</strong>{" "}
            The calculation structure is real — fabric rate × consumption, plus
            process and branding cost, adjusted by quantity slab and margin. The
            numbers feeding it are not. Set real rates in{" "}
            <code className="text-[#9fb0c7]">content/pricing.json</code> and flip{" "}
            <code className="text-[#9fb0c7]">configured</code> to true.
          </p>
        )}
      </aside>
    </div>
  );
}
