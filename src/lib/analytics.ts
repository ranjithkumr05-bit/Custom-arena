import type { Rfq, Status } from "./rfq";

/** Derived metrics for the admin dashboard. All computed from the RFQ set. */
export interface Analytics {
  total: number;
  pieces: number;
  open: number;
  won: number;
  lost: number;
  winRate: number;
  avgOrderPieces: number;
  valueLo: number;
  valueHi: number;
  newThisWeek: number;
  byStatus: Record<string, number>;
  byDay: { day: string; n: number }[];
  byProduct: { label: string; n: number }[];
  byFabric: { label: string; n: number }[];
  byDecoration: { label: string; n: number }[];
  byBuyerType: { label: string; n: number }[];
  byCity: { label: string; n: number }[];
  sizeTotals: Record<string, number>;
  priority: { high: number; medium: number; low: number };
  needsAttention: Rfq[];
  bySource: { label: string; n: number; pieces: number; paid: boolean }[];
  byDevice: { label: string; n: number }[];
  byCampaign: { label: string; n: number; pieces: number }[];
  attributed: number;
}

const DAY = 86_400_000;

function tally(rows: string[], limit = 6) {
  const m = new Map<string, number>();
  for (const r of rows) if (r) m.set(r, (m.get(r) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, n]) => ({ label, n }));
}

export function analyse(rfqs: Rfq[]): Analytics {
  const now = Date.now();

  const byStatus: Record<string, number> = {};
  for (const r of rfqs) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  const won = byStatus.dispatched ?? 0;
  const closed = byStatus.closed ?? 0;
  const lost = byStatus.lost ?? 0;
  const decided = won + closed + lost;

  // Last 14 days of enquiry volume.
  const byDay: { day: string; n: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date(now - i * DAY);
    start.setHours(0, 0, 0, 0);
    const end = start.getTime() + DAY;
    byDay.push({
      day: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      n: rfqs.filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= start.getTime() && t < end;
      }).length,
    });
  }

  const lines = rfqs.flatMap((r) => r.lines ?? []);

  const sizeTotals: Record<string, number> = {};
  for (const l of lines) {
    for (const [k, v] of Object.entries(l.sizes ?? {})) {
      if (v > 0) sizeTotals[k] = (sizeTotals[k] ?? 0) + v;
    }
  }

  const pieces = rfqs.reduce((a, r) => a + r.qty, 0);
  const openRows = rfqs.filter((r) => !["closed", "lost"].includes(r.status));

  // Anything sitting in 'new' for more than two days.
  const needsAttention = rfqs
    .filter((r) => r.status === "new" && now - new Date(r.created_at).getTime() > 2 * DAY)
    .concat(rfqs.filter((r) => r.status === "new" && r.priority === "high"))
    .filter((r, i, a) => a.findIndex((x) => x.ref === r.ref) === i)
    .slice(0, 5);

  // ---- attribution rollup ----
  const srcMap = new Map<string, { n: number; pieces: number; paid: boolean }>();
  for (const r of rfqs) {
    const src = r.utm_source || "direct";
    const med = r.utm_medium || "none";
    const key = med === "none" ? src : `${src} / ${med}`;
    const paid = ["cpc", "ppc", "paid_social", "display", "paid"].includes(med) || !!r.click_id;
    const cur = srcMap.get(key) ?? { n: 0, pieces: 0, paid };
    srcMap.set(key, { n: cur.n + 1, pieces: cur.pieces + r.qty, paid: cur.paid || paid });
  }
  const bySource = [...srcMap.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.pieces - a.pieces)
    .slice(0, 8);

  const campMap = new Map<string, { n: number; pieces: number }>();
  for (const r of rfqs) {
    if (!r.utm_campaign) continue;
    const c = campMap.get(r.utm_campaign) ?? { n: 0, pieces: 0 };
    campMap.set(r.utm_campaign, { n: c.n + 1, pieces: c.pieces + r.qty });
  }
  const byCampaign = [...campMap.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.pieces - a.pieces)
    .slice(0, 6);

  return {
    bySource,
    byCampaign,
    byDevice: tally(rfqs.map((r) => r.device).filter(Boolean), 4),
    attributed: rfqs.filter((r) => r.utm_source && r.utm_source !== "direct").length,
    total: rfqs.length,
    pieces,
    open: openRows.length,
    won,
    lost,
    winRate: decided ? Math.round((won / decided) * 100) : 0,
    avgOrderPieces: rfqs.length ? Math.round(pieces / rfqs.length) : 0,
    valueLo: openRows.reduce((a, r) => a + r.est_low, 0),
    valueHi: openRows.reduce((a, r) => a + r.est_high, 0),
    newThisWeek: rfqs.filter((r) => now - new Date(r.created_at).getTime() < 7 * DAY).length,
    byStatus,
    byDay,
    byProduct: tally(lines.map((l) => l.product)),
    byFabric: tally(lines.map((l) => l.fabric)),
    byDecoration: tally(lines.map((l) => l.decoration)),
    byBuyerType: tally(rfqs.map((r) => r.buyer_type)),
    byCity: tally(rfqs.map((r) => r.city)),
    sizeTotals,
    priority: {
      high: rfqs.filter((r) => r.priority === "high").length,
      medium: rfqs.filter((r) => r.priority === "medium").length,
      low: rfqs.filter((r) => r.priority === "low").length,
    },
    needsAttention,
  };
}

export const FUNNEL_ORDER: Status[] = [
  "new",
  "contacted",
  "quoted",
  "sampling",
  "in_production",
  "dispatched",
];
