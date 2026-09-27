import { SIZES } from "./pricing";

export interface Curve {
  id: string;
  label: string;
  hint: string;
  /** Weights per size, in SIZES order. Need not sum to 1. */
  w: number[];
}

/**
 * Starting distributions for buyers who do not yet have real sizes.
 * These are planning aids, not claims — the UI says so.
 */
export const CURVES: Curve[] = [
  { id: "office",  label: "Office team",   hint: "Adult mixed, skews larger", w: [0.02, 0.10, 0.25, 0.30, 0.22, 0.08, 0.03] },
  { id: "event",   label: "Open event",    hint: "Unknown attendees",         w: [0.03, 0.13, 0.28, 0.30, 0.18, 0.06, 0.02] },
  { id: "team",    label: "Sports team",   hint: "Adult athletic",            w: [0.02, 0.12, 0.26, 0.31, 0.21, 0.07, 0.01] },
  { id: "campus",  label: "College",       hint: "Younger adult",             w: [0.06, 0.22, 0.29, 0.25, 0.13, 0.04, 0.01] },
  { id: "school",  label: "School senior", hint: "Smaller frame",             w: [0.14, 0.28, 0.28, 0.19, 0.08, 0.02, 0.01] },
  { id: "flat",    label: "Even split",    hint: "Equal across sizes",        w: [1, 1, 1, 1, 1, 1, 1] },
];

/**
 * Distribute `total` across a curve using largest-remainder, so the parts
 * always sum to exactly `total` — no drift from naive rounding.
 */
export function applyCurve(total: number, curve: Curve): Record<string, number> {
  const sum = curve.w.reduce((a, b) => a + b, 0);
  const exact = curve.w.map((w) => (w / sum) * total);
  const base = exact.map(Math.floor);
  let remaining = total - base.reduce((a, b) => a + b, 0);

  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; remaining > 0; k = (k + 1) % order.length) {
    base[order[k].i] += 1;
    remaining -= 1;
  }

  const out: Record<string, number> = {};
  SIZES.forEach((s, i) => { out[s] = base[i]; });
  return out;
}
