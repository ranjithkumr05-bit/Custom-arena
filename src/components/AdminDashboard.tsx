"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, STATUS_LABEL, type Rfq, type Status } from "@/lib/rfq";
import { FUNNEL_ORDER, analyse } from "@/lib/analytics";
import { inr } from "@/lib/pricing";
import { BarList, Donut, Funnel, SizeHistogram, Sparkline } from "./charts";
import { Mark } from "./Logo";
import CatalogEditor from "./admin/CatalogEditor";
import MediaLibrary from "./admin/MediaLibrary";
import EmptyState from "./EmptyState";

const PRI: Record<string, string> = {
  high: "bg-[#fdefe9] text-[#a6431f] border-[#e5b4a2]",
  medium: "bg-gold-50 text-[#8a6d1f] border-gold-300",
  low: "bg-sand-100 text-ink-500 border-sand-200",
};

const STATUS_DOT: Record<string, string> = {
  new: "#c8a24a", contacted: "#1b3d68", quoted: "#122d50",
  sampling: "#47638a", in_production: "#1faa52", dispatched: "#0b7a37",
  closed: "#9b9b96", lost: "#c0755e",
};

type Tab = "overview" | "inbox" | "pipeline" | "catalog" | "media";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AdminDashboard({
  rfqs,
  catalog,
  history,
  art,
  filter,
}: {
  rfqs: Rfq[];
  catalog: any[];
  history: any[];
  art: { total: number; pending: number; done: number };
  filter: { status: string; q: string };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState(filter.q);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const a = useMemo(() => analyse(rfqs), [rfqs]);

  function navigate(status: string, query: string) {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (query) p.set("q", query);
    router.push(`/admin${p.toString() ? "?" + p : ""}`);
  }

  async function setStatus(ref: string, status: Status) {
    setBusy(ref);
    await fetch("/api/admin/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, status, note }),
    });
    setNote("");
    setBusy(null);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* ---------- top bar ---------- */}
      <div className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Mark size={30} />
          <div className="mr-auto leading-tight">
            <div className="text-[14.5px] font-semibold text-navy-800">Operations</div>
            <div className="text-[11px] text-ink-400">CustomWear</div>
          </div>

          <a href="/"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-sand-200 px-3 text-[13px] font-semibold text-ink-500 transition hover:border-gold-400 hover:text-navy-800">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5m6-6-6 6 6 6" />
            </svg>
            <span className="hidden sm:inline">Site</span>
          </a>
          <a href="/api/admin/export"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-sand-200 px-3 text-[13px] font-semibold text-navy-800 transition hover:border-gold-400">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </a>
          <button onClick={logout}
            className="min-h-[38px] rounded-md border border-sand-200 px-3 text-[13px] font-semibold text-ink-500 transition hover:border-ink-400">
            Sign out
          </button>
        </div>

        {/* tabs */}
        <div className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-4 sm:px-6">
          {([["overview", "Overview"], ["inbox", "Inbox"], ["pipeline", "Pipeline"], ["catalog", "Catalog"], ["media", "Media"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`shrink-0 border-b-2 px-3.5 pb-2.5 pt-1 text-[13.5px] font-semibold transition ${
                tab === k ? "border-gold-500 text-navy-800" : "border-transparent text-ink-400 hover:text-navy-800"
              }`}>
              {label}
              {k === "inbox" && <span className="ml-1.5 rounded-full bg-sand-100 px-1.5 text-[11px]">{rfqs.length}</span>}
              {k === "catalog" && art.pending > 0 && (
                <span className="ml-1.5 rounded-full bg-gold-500 px-1.5 text-[11px] font-bold text-navy-900">{art.pending}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6">
        {/* ================= OVERVIEW ================= */}
        {tab === "overview" && (
          <div className="grid gap-4">
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Open enquiries" value={String(a.open)} sub={`${a.newThisWeek} new this week`} />
              <Kpi label="Pieces enquired" value={a.pieces.toLocaleString("en-IN")} sub={`avg ${a.avgOrderPieces} per order`} />
              <Kpi label="Open pipeline" value={a.valueLo ? inr(a.valueLo) : "—"} sub={a.valueHi ? `up to ${inr(a.valueHi)}` : "estimate only"} />
              <Kpi label="Win rate" value={`${a.winRate}%`} sub={`${a.won} won · ${a.lost} lost`} />
            </div>

            {/* needs attention */}
            {a.needsAttention.length > 0 && (
              <div className="rounded-2xl border border-[#e5b4a2] bg-[#fdefe9] p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="size-4 text-[#a6431f]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 8v5m0 3.5v.5M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  </svg>
                  <h2 className="text-[15px] text-[#a6431f]">Needs attention</h2>
                </div>
                <div className="grid gap-2">
                  {a.needsAttention.map((r) => (
                    <button key={r.ref}
                      onClick={() => { setTab("inbox"); setOpen(r.ref); }}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/70 px-3.5 py-2.5 text-left transition hover:bg-white">
                      <span className="text-[13px] font-bold text-navy-800">{r.ref}</span>
                      <span className="flex-1 text-[13px] text-ink-500">{r.name} · {r.qty} pcs</span>
                      <span className="text-[12px] font-semibold text-[#a6431f]">
                        {r.priority === "high" ? "high value, unactioned" : "waiting 2+ days"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              <Card title="Enquiries, last 14 days" className="lg:col-span-2">
                <Sparkline data={a.byDay.map((d) => d.n)} labels={a.byDay.map((d) => d.day)} height={92} />
              </Card>

              <Card title="Lead quality">
                <Donut
                  centreValue={String(a.total)} centreLabel="enquiries"
                  slices={[
                    { label: "High", n: a.priority.high, colour: "#c8a24a" },
                    { label: "Medium", n: a.priority.medium, colour: "#47638a" },
                    { label: "Low", n: a.priority.low, colour: "#d9d6cc" },
                  ]}
                />
              </Card>

              <Card title="Conversion funnel">
                <Funnel
                  stages={[
                    ...FUNNEL_ORDER.map((s) => ({ label: STATUS_LABEL[s], n: a.byStatus[s] ?? 0 })),
                    { label: "Lost", n: a.byStatus.lost ?? 0, tone: "bad" as const },
                  ]}
                />
              </Card>

              <Card title="Demand by size">
                <SizeHistogram sizes={a.sizeTotals} />
                <p className="mt-3 text-[11.5px] leading-relaxed text-ink-400">
                  Aggregate across every enquiry. Useful for planning stock fabric
                  against the sizes actually being asked for.
                </p>
              </Card>

              <Card title="Top products">
                <BarList rows={a.byProduct} />
              </Card>

              <Card title="Branding methods">
                <BarList rows={a.byDecoration} />
              </Card>

              <Card title="Buyer types">
                <BarList rows={a.byBuyerType} />
              </Card>

              <Card title="Buyer location">
                <BarList rows={a.byCity} />
              </Card>

              <Card title="Traffic source → enquiries" className="lg:col-span-2">
                {a.bySource.length === 0 ? (
                  <p className="text-[13px] text-ink-400">No enquiries yet.</p>
                ) : (
                  <div className="grid gap-2.5">
                    {a.bySource.map((s) => {
                      const max = Math.max(...a.bySource.map((x) => x.pieces), 1);
                      return (
                        <div key={s.label} className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-3">
                          <span className="flex items-center gap-1.5 truncate text-[12.5px] text-ink-500">
                            {s.paid && <span className="rounded bg-gold-500 px-1 text-[9px] font-bold text-navy-900">PAID</span>}
                            {s.label}
                          </span>
                          <div className="h-6 overflow-hidden rounded bg-sand-100">
                            <div className="h-full rounded transition-all duration-500"
                              style={{
                                width: `${Math.max((s.pieces / max) * 100, 2)}%`,
                                background: s.paid
                                  ? "linear-gradient(90deg,#c8a24a,#a8842f)"
                                  : "linear-gradient(90deg,#0b1f3a,#1b3d68)",
                              }} />
                          </div>
                          <span className="w-[92px] text-right text-[12.5px] tabular-nums text-navy-800">
                            <b>{s.pieces.toLocaleString("en-IN")}</b> pcs
                            <span className="ml-1 text-ink-400">/{s.n}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="mt-3.5 border-t border-sand-100 pt-3 text-[11.5px] leading-relaxed text-ink-400">
                  Measured by <b>pieces enquired</b>, not clicks. A source sending
                  10 visitors who ask for 4,000 pieces beats one sending 400 who ask
                  for none — and click-based analytics will tell you the opposite.
                  {a.attributed === 0 && " No campaign-tagged traffic yet: add ?utm_source= to your ad links."}
                </p>
              </Card>

              {a.byCampaign.length > 0 && (
                <Card title="Campaigns">
                  <BarList rows={a.byCampaign.map((c) => ({ label: c.label, n: c.pieces }))} unit=" pcs" />
                </Card>
              )}

              <Card title="Device">
                <BarList rows={a.byDevice} />
              </Card>
            </div>
          </div>
        )}

        {/* ================= INBOX ================= */}
        {tab === "inbox" && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <form onSubmit={(e) => { e.preventDefault(); navigate(filter.status, q); }} className="flex flex-1 gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Search ref, name, organisation, phone, city…"
                  className="min-h-[40px] min-w-[180px] flex-1 rounded-md border border-sand-200 bg-white px-3 text-[14px] focus:border-navy-600 focus:outline-none" />
                <button className="min-h-[40px] rounded-md bg-navy-800 px-4 text-[13.5px] font-semibold text-white">
                  Search
                </button>
              </form>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-1.5 pb-1">
                {(["all", ...STATUSES] as const).map((s) => (
                  <button key={s} onClick={() => navigate(s, q)}
                    className={`min-h-[32px] shrink-0 rounded-full border px-3 text-[12.5px] font-semibold transition ${
                      filter.status === s ? "border-navy-800 bg-navy-800 text-white" : "border-sand-200 bg-white text-ink-500"
                    }`}>
                    {s === "all" ? "All" : STATUS_LABEL[s]}
                    {s !== "all" && a.byStatus[s] ? <span className="ml-1.5 opacity-60">{a.byStatus[s]}</span> : null}
                  </button>
                ))}
              </div>
            </div>

            {rfqs.length === 0 ? (
              <EmptyState
                title="Nothing here"
                body="No enquiries match this filter. Clear the search or pick a different status."
                action={{ href: "/admin", label: "Clear filters" }}
              />
            ) : (
              <div className="grid gap-2.5">
                {rfqs.map((r) => (
                  <RfqCard key={r.ref} r={r} isOpen={open === r.ref}
                    onToggle={() => setOpen(open === r.ref ? null : r.ref)}
                    note={note} setNote={setNote} busy={busy === r.ref} setStatus={setStatus} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= PIPELINE ================= */}
        {tab === "pipeline" && (
          <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3" style={{ minWidth: "max-content" }}>
              {STATUSES.filter((s) => s !== "closed").map((s) => {
                const col = rfqs.filter((r) => r.status === s);
                const pcs = col.reduce((x, r) => x + r.qty, 0);
                return (
                  <div key={s} className="w-[270px] shrink-0 rounded-2xl bg-white p-3 ring-1 ring-sand-200">
                    <div className="mb-3 flex items-center gap-2 px-1">
                      <span className="size-2 rounded-full" style={{ background: STATUS_DOT[s] }} />
                      <span className="text-[13px] font-bold text-navy-800">{STATUS_LABEL[s]}</span>
                      <span className="ml-auto text-[11.5px] text-ink-400">{col.length} · {pcs} pcs</span>
                    </div>
                    <div className="grid gap-2">
                      {col.length === 0 && (
                        <div className="rounded-lg border border-dashed border-sand-200 py-6 text-center text-[12px] text-ink-400">
                          empty
                        </div>
                      )}
                      {col.map((r) => (
                        <button key={r.ref}
                          onClick={() => { setTab("inbox"); setOpen(r.ref); }}
                          className="w-full rounded-lg border border-sand-200 bg-sand-50 p-3 text-left transition hover:border-gold-400 hover:bg-white">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-[12px] font-bold text-navy-800">{r.ref}</span>
                            <span className={`ml-auto rounded-full border px-1.5 text-[9.5px] font-bold uppercase ${PRI[r.priority]}`}>
                              {r.priority}
                            </span>
                          </div>
                          <div className="truncate text-[13px] font-medium text-navy-800">{r.name}</div>
                          <div className="truncate text-[11.5px] text-ink-400">{r.organisation || r.buyer_type}</div>
                          <div className="mt-2 flex items-center justify-between text-[11.5px]">
                            <span className="font-semibold text-navy-800">{r.qty} pcs</span>
                            <span className="text-ink-400">{r.city}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {tab === "catalog" && <CatalogEditor catalog={catalog} history={history} art={art} />}

        {tab === "media" && <MediaLibrary />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4">
      <div className="text-[11.5px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-0.5 text-[clamp(20px,4vw,26px)] font-semibold tracking-tight text-navy-800">{value}</div>
      {sub && <div className="text-[11.5px] text-ink-400">{sub}</div>}
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-sand-200 bg-white p-4 sm:p-5 ${className}`}>
      <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.08em] text-ink-400">{title}</h2>
      {children}
    </div>
  );
}

function RfqCard({
  r, isOpen, onToggle, note, setNote, busy, setStatus,
}: {
  r: Rfq; isOpen: boolean; onToggle: () => void;
  note: string; setNote: (v: string) => void;
  busy: boolean; setStatus: (ref: string, s: Status) => void;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border bg-white transition ${isOpen ? "border-navy-600 shadow-md" : "border-sand-200"}`}>
      <button onClick={onToggle} className="w-full px-4 py-3 text-left sm:px-5">
        {/* mobile: stacked. desktop: row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[13px] font-bold text-navy-800">{r.ref}</span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PRI[r.priority]}`}>
            {r.priority}
          </span>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-500">
            <span className="size-1.5 rounded-full" style={{ background: STATUS_DOT[r.status] }} />
            {STATUS_LABEL[r.status]}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-[14.5px] font-medium text-navy-800">{r.name}</span>
          <span className="text-[12.5px] text-ink-400">{r.organisation || r.buyer_type}</span>
          <span className="ml-auto text-[14px] font-semibold text-navy-800">{r.qty} pcs</span>
        </div>
        <div className="mt-0.5 text-[12px] text-ink-400">
          {r.city && `${r.city} · `}{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          {r.est_low > 0 && ` · ${inr(r.est_low)}–${inr(r.est_high)}`}
        </div>
      </button>

      {isOpen && (
        <div className="grid gap-5 border-t border-sand-100 p-4 sm:p-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <D k="Phone" v={<a href={`tel:${r.phone}`} className="underline">{r.phone}</a>} />
              <D k="WhatsApp" v={<a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-[#1faa52] underline">Open chat</a>} />
              <D k="Email" v={r.email || "—"} />
              <D k="Required by" v={r.required_by || "—"} />
              <D k="Buyer type" v={r.buyer_type || "—"} />
              <D k="Lead score" v={`${r.score} / 110`} />
              <D k="Came from" v={
                <span className="inline-flex flex-wrap items-center gap-1">
                  {r.click_id && <span className="rounded bg-gold-500 px-1 text-[9px] font-bold text-navy-900">PAID</span>}
                  {r.utm_source ? `${r.utm_source}${r.utm_medium ? " / " + r.utm_medium : ""}` : "direct"}
                  {r.utm_campaign && <span className="text-ink-400">· {r.utm_campaign}</span>}
                </span>
              } />
              <D k="Landed on" v={<span className="break-all text-[12px]">{r.landing_page || "—"}</span>} />
            </div>

            <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-gold-500">
              Items ({r.lines?.length ?? 0})
            </div>
            <div className="grid gap-2">
              {(r.lines ?? []).map((l, i) => (
                <div key={i} className="rounded-lg bg-sand-50 p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-[13.5px] font-semibold text-navy-800">
                      {l.product} · {l.fabric}
                      {l.colour && <span className="ml-2 font-normal text-ink-400">{l.colour}</span>}
                    </span>
                    <span className="text-[13.5px] font-semibold text-navy-800">{l.qty} pcs</span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-ink-500">
                    {l.decoration !== "none" ? `${l.decoration} × ${l.positions}` : "No branding"} · {inr(l.est_low)}–{inr(l.est_high)}/pc
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {Object.entries(l.sizes).filter(([, v]) => v > 0).map(([k, v]) => (
                      <span key={k} className="rounded bg-white px-1.5 py-0.5 text-[11.5px] font-medium text-navy-800">{k}:{v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {(r.files ?? []).length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 text-[11.5px] font-bold uppercase tracking-wide text-gold-500">
                  Artwork ({(r.files ?? []).length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {(r.files ?? []).map((f) => (
                    <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                      className="group w-[110px] overflow-hidden rounded-lg border border-sand-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.original_name} className="h-[80px] w-full bg-sand-50 object-contain" />
                      <span className="block truncate px-2 py-1 text-[10.5px] text-ink-500">{f.original_name}</span>
                      {f.colours > 0 && (
                        <span className="block px-2 pb-1.5 text-[10px] font-semibold text-[#8a6d1f]">
                          ~{f.colours} colours
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {r.notes && (
              <div className="mt-4">
                <div className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-gold-500">Buyer notes</div>
                <p className="rounded-lg bg-sand-50 p-3 text-[13.5px] leading-relaxed text-ink-500">{r.notes}</p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-gold-500">Move to</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note recorded against this change…"
              className="mb-2.5 min-h-[58px] w-full resize-y rounded-md border border-sand-200 p-2.5 text-[13px] focus:border-navy-600 focus:outline-none" />
            <div className="mb-5 flex flex-wrap gap-1.5">
              {STATUSES.filter((s) => s !== r.status).map((s) => (
                <button key={s} disabled={busy} onClick={() => setStatus(r.ref, s)}
                  className="min-h-[34px] rounded-md border border-sand-200 px-2.5 text-[12px] font-semibold text-ink-500 transition hover:border-navy-600 hover:text-navy-800 disabled:opacity-50">
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-gold-500">Timeline</div>
            <ul className="grid gap-2">
              {(r.events ?? []).map((e) => (
                <li key={e.id} className="border-l-2 border-sand-200 pl-3 text-[12.5px]">
                  <div className="text-ink-400">
                    {new Date(e.at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {e.actor}
                  </div>
                  <div className="text-navy-800">
                    {e.type === "status_change"
                      ? `${STATUS_LABEL[e.from_status as Status] ?? e.from_status} → ${STATUS_LABEL[e.to_status as Status] ?? e.to_status}`
                      : e.type === "created" ? "Enquiry created" : "Note"}
                  </div>
                  {e.note && <div className="text-ink-500">{e.note}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function D({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-400">{k}</div>
      <div className="text-[13.5px] text-navy-800">{v}</div>
    </div>
  );
}
