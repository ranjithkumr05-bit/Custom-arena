"use client";

import { useEffect, useMemo, useState } from "react";
import { PRICING, SITE } from "@/lib/content";
import { MOQ, SIZES, calculate, inr } from "@/lib/pricing";
import { CURVES, applyCurve } from "@/lib/sizecurves";
import { readAttribution } from "@/lib/marketing";
import ArtworkUpload, { type Uploaded } from "./ArtworkUpload";
import { track } from "./Analytics";
import GarmentPreview, { GARMENT_COLOURS, PLACEMENTS, type Placement } from "./GarmentPreview";

const PRODUCTS = Object.entries(PRICING.product).map(([k, v]) => ({ k, label: v.label }));
const FABRICS = Object.entries(PRICING.fabric).map(([k, v]) => ({ k, label: v.label }));
const DECOS = Object.entries(PRICING.decoration).map(([k, v]) => ({ k, label: v.label }));

const BUYERS = [
  "Company / corporate", "School or college", "Sports team or club",
  "Event organiser", "Retailer / reseller", "Brand / private label",
];

interface Line {
  uid: number;
  product: string;
  fabric: string;
  decoration: string;
  positions: number;
  colourHex: string;
  colourName: string;
  placement: Placement;
  sizes: Record<string, number>;
}

let uidSeq = 1;
const newLine = (product = "tee"): Line => ({
  uid: uidSeq++,
  product,
  fabric: "single-jersey",
  decoration: "dtf",
  positions: 1,
  colourHex: "#0b1f3a",
  colourName: "Navy",
  placement: "left-chest",
  sizes: {},
});

const field =
  "min-h-[42px] w-full rounded-md border border-sand-200 bg-white px-3 text-[16px] text-ink-700 transition focus:border-navy-600 focus:outline-none focus:ring-[3px] focus:ring-navy-600/12";

function L({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[12px] font-semibold text-navy-800">{children}</span>;
}

export default function QuoteBuilder({
  initialProduct,
  reorderRef,
  initialKind = "quote",
}: {
  initialProduct?: string;
  reorderRef?: string;
  initialKind?: "quote" | "sample";
}) {
  const [lines, setLines] = useState<Line[]>([newLine(initialProduct)]);
  const [activeUid, setActiveUid] = useState(lines[0].uid);
  const [kind, setKind] = useState<"quote" | "sample">(initialKind);

  const [form, setForm] = useState({
    name: "", organisation: "", phone: "", email: "", city: "",
    buyerType: BUYERS[0], requiredBy: "", notes: "", website: "",
  });

  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [result, setResult] = useState<{ ref: string; priority: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState("");
  const [bulkQty, setBulkQty] = useState(60);
  const [reordered, setReordered] = useState<string | null>(null);
  const [startedTracked, setStartedTracked] = useState(false);
  const [artwork, setArtwork] = useState<Uploaded[]>([]);
  // Random per-session token. Uploads are claimed with it when the enquiry is
  // created, so a guessed file id cannot pull in someone else's artwork.
  const [uploadToken] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  );

  // Fire once, the moment the buyer actually commits a quantity — a page view
  // on /quote is not an intent signal, a filled size box is.
  useEffect(() => {
    if (startedTracked) return;
    const q = lines.reduce((a, l) => a + Object.values(l.sizes).reduce((x, y) => x + (y || 0), 0), 0);
    if (q > 0) { track("begin_checkout", { currency: "INR" }); setStartedTracked(true); }
  }, [lines, startedTracked]);

  // Repeat business is most of this sector. Pulling a previous order straight
  // back into the builder is the single highest-value thing the portal does.
  useEffect(() => {
    if (!reorderRef) return;
    let cancelled = false;
    fetch(`/api/portal?ref=${encodeURIComponent(reorderRef)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.order?.lines?.length) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ls: Line[] = j.order.lines.map((l: any) => ({
          ...newLine(l.product),
          fabric: l.fabric,
          decoration: l.decoration,
          positions: l.positions || 1,
          colourName: l.colour || "Navy",
          colourHex: GARMENT_COLOURS.find((c) => c.name === l.colour)?.hex ?? "#0b1f3a",
          sizes: l.sizes ?? {},
        }));
        setLines(ls);
        setActiveUid(ls[0].uid);
        setForm((f) => ({
          ...f,
          name: j.order.name ?? f.name,
          organisation: j.order.organisation ?? f.organisation,
          phone: j.order.phone ?? f.phone,
          email: j.order.email ?? f.email,
          city: j.order.city ?? f.city,
          buyerType: j.order.buyer_type || f.buyerType,
        }));
        setReordered(j.order.ref);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [reorderRef]);

  const active = lines.find((l) => l.uid === activeUid) ?? lines[0];

  const patch = (uid: number, p: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.uid === uid ? { ...l, ...p } : l)));

  /* ---------- costing ---------- */
  const priced = useMemo(
    () =>
      lines.map((l) => ({
        line: l,
        calc: calculate({
          product: l.product, fabric: l.fabric, decoration: l.decoration,
          positions: l.positions, sizes: l.sizes,
        }),
      })),
    [lines]
  );

  const grandQty = priced.reduce((a, p) => a + p.calc.qty, 0);
  const grandLow = priced.reduce((a, p) => a + p.calc.orderLow, 0);
  const grandHigh = priced.reduce((a, p) => a + p.calc.orderHigh, 0);
  const minQty = kind === "sample" ? 75 : MOQ;
  const belowMin = grandQty > 0 && grandQty < minQty;

  /* ---------- whatsapp ---------- */
  const waText = [
    kind === "sample" ? "Hi, I would like to request a sample." : "Hi, I would like a quote.",
    "",
    ...priced.flatMap(({ line, calc }, i) => [
      `${lines.length > 1 ? `Item ${i + 1}: ` : ""}${PRICING.product[line.product as keyof typeof PRICING.product]?.label}`,
      `  Fabric: ${PRICING.fabric[line.fabric as keyof typeof PRICING.fabric]?.label}`,
      `  Colour: ${line.colourName}`,
      `  Branding: ${line.decoration === "none" ? "None" : `${line.decoration.toUpperCase()} x ${line.positions}, ${line.placement.replace("-", " ")}`}`,
      `  Sizes: ${SIZES.filter((s) => line.sizes[s] > 0).map((s) => `${s}:${line.sizes[s]}`).join(", ") || "-"}`,
      `  Qty: ${calc.qty}`,
      "",
    ]),
    `Total: ${grandQty} pcs`,
    `Delivery city: ${form.city}`,
    "",
    "Please confirm rate and timeline.",
  ].join("\n");

  const waLink = `https://wa.me/${SITE.contact.whatsapp.value}?text=${encodeURIComponent(waText)}`;

  /* ---------- submit ---------- */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setTopError("");
    setState("sending");

    const payload = {
      kind,
      attribution: readAttribution(),
      uploadToken,
      attachmentIds: artwork.map((a) => a.id),
      ...form,
      lines: priced.map(({ line, calc }) => ({
        product: line.product, fabric: line.fabric, decoration: line.decoration,
        positions: line.positions, colour: line.colourName, sizes: line.sizes,
        qty: calc.qty,
        est_low: Math.round(calc.unitLow), est_high: Math.round(calc.unitHigh),
      })),
    };

    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.errors ?? {});
        setTopError(json.error ?? "Something went wrong");
        setState("idle");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      track("generate_lead", {
        value: Math.round(grandLow),
        currency: "INR",
        items: priced.length,
        quantity: grandQty,
        lead_type: kind,
      });
      setResult({ ref: json.ref, priority: json.priority });
      setState("done");
    } catch {
      setTopError("Network error — please try again or message us on WhatsApp.");
      setState("idle");
    }
  }

  /* ---------- success ---------- */
  if (state === "done" && result) {
    return (
      <div className="mx-auto max-w-[620px] rounded-2xl border border-sand-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-gold-50">
          <svg viewBox="0 0 24 24" className="size-7 text-gold-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m4 12.5 5 5L20 6.5" />
          </svg>
        </div>
        <h3 className="mb-2 text-[26px]">Request received</h3>
        <p className="mb-1 text-[15px] text-ink-500">Your reference is</p>
        <p className="mb-5 text-[30px] font-bold tracking-tight text-navy-800">{result.ref}</p>
        <p className="mx-auto mb-7 max-w-[420px] text-[14.5px] leading-relaxed text-ink-500">
          Save this reference — you can check the production stage on the Track
          Order page at any time.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-[46px] items-center rounded-md bg-[#1faa52] px-5 text-[14.5px] font-semibold text-white">
            Send on WhatsApp too
          </a>
          <a href={`/track?ref=${result.ref}`}
            className="inline-flex min-h-[46px] items-center rounded-md border border-sand-200 px-5 text-[14.5px] font-semibold text-navy-800">
            Track this order
          </a>
        </div>
      </div>
    );
  }

  /* ---------- builder ---------- */
  return (
    <form onSubmit={submit} noValidate className="grid items-start gap-7 lg:grid-cols-[1.45fr_1fr]">
      <div className="space-y-5">
        {reordered && (
          <p className="rounded-lg border border-gold-300 bg-gold-50 px-4 py-3 text-[13.5px] font-medium text-[#8a6d1f]">
            Loaded from <b>{reordered}</b> — same products, fabrics and size
            breakdown. Change anything you need before sending.
          </p>
        )}

        {topError && (
          <p className="rounded-lg border border-[#e5b4a2] bg-[#fdefe9] px-4 py-3 text-[14px] font-medium text-[#a6431f]">
            {topError}
          </p>
        )}

        {/* kind toggle */}
        <div className="inline-flex rounded-lg border border-sand-200 bg-white p-1">
          {([["quote", "Bulk quote"], ["sample", "Sample first (orders 75+)"]] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={`min-h-[38px] rounded-md px-4 text-[13.5px] font-semibold transition ${
                kind === k ? "bg-navy-800 text-white" : "text-ink-500 hover:text-navy-800"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ---- lines ---- */}
        {priced.map(({ line, calc }, idx) => {
          const isOpen = line.uid === activeUid;
          return (
            <div key={line.uid}
              className={`overflow-hidden rounded-2xl border bg-white transition ${
                isOpen ? "border-navy-600 shadow-md" : "border-sand-200"
              }`}>
              <button type="button" onClick={() => setActiveUid(line.uid)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-navy-800 text-[12px] font-bold text-gold-400">
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold text-navy-800">
                    {PRICING.product[line.product as keyof typeof PRICING.product]?.label}
                    <span className="ml-2 font-normal text-ink-400">{line.colourName}</span>
                  </span>
                  <span className="block text-[12.5px] text-ink-400">
                    {calc.qty} pcs · {PRICING.fabric[line.fabric as keyof typeof PRICING.fabric]?.label}
                    {line.decoration !== "none" && ` · ${line.decoration.toUpperCase()}`}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border-2 border-sand-200" style={{ background: line.colourHex, width: 20, height: 20 }} />
                {lines.length > 1 && (
                  <span role="button" tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLines((ls) => ls.filter((l) => l.uid !== line.uid));
                      if (activeUid === line.uid) setActiveUid(lines[0].uid);
                    }}
                    className="shrink-0 rounded p-1.5 text-ink-400 hover:bg-sand-100 hover:text-[#a6431f]"
                    aria-label={`Remove item ${idx + 1}`}>
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </span>
                )}
                <svg viewBox="0 0 24 24" className={`size-4 shrink-0 text-ink-400 transition ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div className="space-y-5 border-t border-sand-100 p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label><L>Product</L>
                      <select className={field} value={line.product} onChange={(e) => patch(line.uid, { product: e.target.value })}>
                        {PRODUCTS.map((p) => <option key={p.k} value={p.k}>{p.label}</option>)}
                      </select>
                    </label>
                    <label><L>Fabric</L>
                      <select className={field} value={line.fabric} onChange={(e) => patch(line.uid, { fabric: e.target.value })}>
                        {FABRICS.map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
                      </select>
                    </label>
                    <label><L>Branding</L>
                      <select className={field} value={line.decoration} onChange={(e) => patch(line.uid, { decoration: e.target.value })}>
                        {DECOS.map((d) => <option key={d.k} value={d.k}>{d.label}</option>)}
                      </select>
                    </label>
                  </div>

                  {/* colour */}
                  <div>
                    <L>Colour — <span className="font-normal text-ink-400">{line.colourName}</span></L>
                    <div className="flex flex-wrap gap-1.5">
                      {GARMENT_COLOURS.map((c) => (
                        <button key={c.hex} type="button" title={c.name}
                          onClick={() => patch(line.uid, { colourHex: c.hex, colourName: c.name })}
                          aria-label={c.name}
                          className={`size-8 rounded-full border-2 transition ${
                            line.colourHex === c.hex ? "border-navy-800 ring-2 ring-gold-400 ring-offset-1" : "border-sand-200 hover:border-ink-400"
                          }`}
                          style={{ background: c.hex }} />
                      ))}
                    </div>
                  </div>

                  {/* placement */}
                  {line.decoration !== "none" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <L>Placement</L>
                        <div className="flex flex-wrap gap-1.5">
                          {PLACEMENTS.map((p) => (
                            <button key={p.id} type="button"
                              onClick={() => patch(line.uid, { placement: p.id })}
                              className={`min-h-[34px] rounded-full border px-3 text-[12.5px] font-medium transition ${
                                line.placement === p.id
                                  ? "border-navy-800 bg-navy-800 text-white"
                                  : "border-sand-200 text-ink-500 hover:border-gold-400"
                              }`}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label><L>Number of positions</L>
                        <select className={field} value={line.positions} onChange={(e) => patch(line.uid, { positions: +e.target.value })}>
                          <option value={1}>1 position</option>
                          <option value={2}>2 positions</option>
                          <option value={3}>3 positions</option>
                          <option value={4}>4 or more</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {/* artwork */}
                  {line.decoration !== "none" && (
                    <div>
                      <L>Artwork <span className="font-normal text-ink-400">— optional, but it makes the quote accurate</span></L>
                      <ArtworkUpload token={uploadToken} files={artwork} onChange={setArtwork} />
                    </div>
                  )}

                  {/* size matrix */}
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <L>Size breakdown</L>
                      <button type="button" onClick={() => patch(line.uid, { sizes: {} })}
                        className="text-[12px] font-medium text-ink-400 underline underline-offset-2 hover:text-navy-800">
                        clear
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 rounded-lg border border-sand-200 bg-sand-50 p-2.5 sm:grid-cols-7 sm:gap-2 sm:p-3">
                      {SIZES.map((s) => (
                        <label key={s} className="flex flex-col gap-1">
                          <span className="text-center text-[11px] font-bold text-navy-800">{s}</span>
                          <input type="number" min={0} inputMode="numeric" placeholder="0"
                            value={line.sizes[s] || ""}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              patch(line.uid, { sizes: { ...line.sizes, [s]: Number.isNaN(v) || v < 0 ? 0 : v } });
                            }}
                            className={`no-spin min-h-[46px] rounded-md border px-1 text-center text-[16px] font-semibold text-navy-800 transition focus:outline-none focus:ring-[3px] focus:ring-gold-500/20 ${
                              line.sizes[s] > 0 ? "border-gold-300 bg-gold-50" : "border-sand-200 bg-white"
                            }`} />
                        </label>
                      ))}
                    </div>

                    {/* curve presets */}
                    <div className="mt-3 rounded-lg border border-sand-200 bg-white p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-navy-800">Don&apos;t have sizes yet?</span>
                        <span className="text-[12px] text-ink-400">Spread</span>
                        <input type="number" min={1} value={bulkQty}
                          onChange={(e) => setBulkQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="no-spin h-8 w-16 rounded border border-sand-200 px-2 text-center text-[13px] font-semibold text-navy-800 focus:outline-none" />
                        <span className="text-[12px] text-ink-400">pcs across:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {CURVES.map((c) => (
                          <button key={c.id} type="button" title={c.hint}
                            onClick={() => patch(line.uid, { sizes: applyCurve(bulkQty, c) })}
                            className="min-h-[32px] rounded-full border border-sand-200 px-3 text-[12px] font-medium text-ink-500 transition hover:border-gold-400 hover:text-navy-800">
                            {c.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[11.5px] leading-relaxed text-ink-400">
                        Starting points for planning, not predictions. Collect real sizes where you can — these curves exist for open events where you cannot.
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[13px]">
                      <span className="text-ink-400">
                        {calc.slab ? `Slab ${calc.slab.label}` : "—"}
                      </span>
                      <span className="text-ink-500">
                        Line total <b className="text-[15px] text-navy-800">{calc.qty}</b> pcs
                        {PRICING.configured && calc.slab && <span className="ml-2 text-ink-400">{inr(calc.unitLow)}–{inr(calc.unitHigh)}/pc</span>}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button type="button"
          onClick={() => { const l = newLine(); setLines((ls) => [...ls, l]); setActiveUid(l.uid); }}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sand-200 text-[14px] font-semibold text-ink-500 transition hover:border-gold-400 hover:text-navy-800">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add another product to this enquiry
        </button>

        {/* ---- buyer ---- */}
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <div className="mb-4 text-[11.5px] font-bold uppercase tracking-[0.1em] text-gold-500">About you</div>

          {/* honeypot */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off"
            value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="absolute size-0 overflow-hidden opacity-0" aria-hidden="true" />

          <div className="grid gap-3 sm:grid-cols-2">
            <label><L>Your name</L>
              <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <span className="mt-1 block text-[12px] text-[#a6431f]">{errors.name}</span>}
            </label>
            <label><L>Organisation</L>
              <input className={field} value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label><L>Phone / WhatsApp</L>
              <input type="tel" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              {errors.phone && <span className="mt-1 block text-[12px] text-[#a6431f]">{errors.phone}</span>}
            </label>
            <label><L>Email</L>
              <input type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <span className="mt-1 block text-[12px] text-[#a6431f]">{errors.email}</span>}
            </label>
            <label><L>Delivery city</L>
              <input className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label><L>Buyer type</L>
              <select className={field} value={form.buyerType} onChange={(e) => setForm({ ...form, buyerType: e.target.value })}>
                {BUYERS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
            <label><L>Required by</L>
              <input type="date" className={field} value={form.requiredBy} onChange={(e) => setForm({ ...form, requiredBy: e.target.value })} />
            </label>
          </div>
          <label className="mt-3 block"><L>Anything else</L>
            <textarea className={`${field} min-h-[80px] resize-y py-2.5`}
              placeholder="Specific GSM, packing requirement, label instructions, repeat of a previous order…"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
        </div>
      </div>

      {/* ================= STICKY PANEL ================= */}
      <aside className="space-y-4 lg:sticky lg:top-[136px]">
        {/* preview */}
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white">
          <div className="flex items-center justify-between border-b border-sand-100 px-4 py-2.5">
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-gold-500">Preview</span>
            <span className="text-[12px] text-ink-400">{active.colourName}</span>
          </div>
          <div className="grid place-items-center bg-[radial-gradient(circle_at_50%_38%,#f6f5f1,#eceae3)] p-4">
            <div className="h-[230px] w-full max-w-[210px]">
              <GarmentPreview product={active.product} colour={active.colourHex}
                placement={active.placement} method={active.decoration} positions={active.positions} />
            </div>
          </div>
          <p className="border-t border-sand-100 px-4 py-2.5 text-[11.5px] leading-relaxed text-ink-400">
            Indicative shape and placement only — not a print-accurate proof.
            A physical or digital proof is approved before bulk.
          </p>
        </div>

        {/* estimate */}
        <div aria-live="polite" className="rounded-2xl bg-navy-800 p-5 text-[#c9d4e4]">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-[16px] text-white">Estimate</h3>
            <span className="text-[12px] text-[#8ea0b9]">{lines.length} item{lines.length > 1 ? "s" : ""}</span>
          </div>

          {priced.map(({ line, calc }, i) => (
            <div key={line.uid} className="flex justify-between gap-3 border-b border-white/8 py-2 text-[13px]">
              <span className="min-w-0 truncate text-[#8ea0b9]">
                {i + 1}. {PRICING.product[line.product as keyof typeof PRICING.product]?.label}
              </span>
              <span className="shrink-0 font-semibold text-[#e3e9f2]">
                {calc.qty} pcs {PRICING.configured && calc.slab ? `· ${inr(calc.orderLow)}` : ""}
              </span>
            </div>
          ))}

          <div className="mt-4 border-t border-white/18 pt-4">
            {/* While pricing.configured is false every rate is invented, so
                the figures are withheld rather than shown with a disclaimer.
                A buyer does not read the small print under a number. Flip
                "configured" to true in content/pricing.json and the estimate
                appears on its own. */}
            {!PRICING.configured ? (
              <>
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold-400">
                  Your order
                </div>
                <div className="my-1 text-[24px] font-bold tracking-tight text-white">
                  {grandQty} pieces
                </div>
                <p className="text-[12.5px] leading-relaxed text-[#8ea0b9]">
                  We quote per job rather than from a table — fabric, colours and
                  quantity all move the number. Send this and you will have a
                  real rate back, not an estimate.
                </p>
              </>
            ) : (
            <>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold-400">
              Estimated order total
            </div>
            <div className="my-1 text-[27px] font-bold tracking-tight text-white">
              {grandQty >= minQty ? `${inr(grandLow)} – ${inr(grandHigh)}` : "—"}
            </div>
            <div className="text-[12.5px] text-[#8ea0b9]">
              {grandQty >= minQty
                ? `${grandQty} pieces across ${lines.length} item${lines.length > 1 ? "s" : ""}`
                : belowMin
                  ? `Minimum ${minQty} pieces — add ${minQty - grandQty} more`
                  : "Enter a size breakdown"}
            </div>

            </>
            )}
          </div>

          <button type="submit" disabled={state === "sending"}
            className="mt-4 min-h-[48px] w-full rounded-md bg-gold-500 text-[15px] font-bold text-navy-900 transition hover:bg-gold-400 disabled:opacity-60">
            {state === "sending" ? "Sending…" : kind === "sample" ? "Request a sample" : "Send quote request"}
          </button>

          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="mt-2 grid min-h-[44px] place-items-center rounded-md bg-[#1faa52] text-[14px] font-semibold text-white transition hover:bg-[#1a9147]">
            Send on WhatsApp instead
          </a>


        </div>
      </aside>
    </form>
  );
}
