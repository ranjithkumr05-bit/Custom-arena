import { PRICING } from "./content";

export type Sizes = Record<string, number>;

export interface QuoteInput {
  product: string;
  fabric: string;
  decoration: string;
  positions: number;
  sizes: Sizes;
}

export interface QuoteResult {
  qty: number;
  slab: { label: string; multiplier: number } | null;
  belowMoq: boolean;
  unitLow: number;
  unitHigh: number;
  orderLow: number;
  orderHigh: number;
  setup: number;
  breakdown: { label: string; value: string }[];
  configured: boolean;
}

export const SIZES = PRICING.sizes;
export const MOQ = PRICING.moq;

export function totalQty(sizes: Sizes) {
  return Object.values(sizes).reduce(
    (a, b) => a + (Number.isFinite(b) && b > 0 ? b : 0),
    0
  );
}

export function findSlab(qty: number) {
  return (
    PRICING.slabs.find((s) => qty >= s.min && qty <= s.max) ?? null
  );
}

export function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/**
 * unit = (fabricRate x consumption + processCost + decorationRate x positions)
 *        x (1 + margin) x quantitySlabMultiplier
 *
 * Displayed as a +/- spread range, never a single figure.
 */
export function calculate(input: QuoteInput): QuoteResult {
  const qty = totalQty(input.sizes);
  const slab = findSlab(qty);

  const product =
    PRICING.product[input.product as keyof typeof PRICING.product] ??
    PRICING.product.tee;
  const fabric =
    PRICING.fabric[input.fabric as keyof typeof PRICING.fabric] ??
    PRICING.fabric["single-jersey"];
  const deco =
    PRICING.decoration[input.decoration as keyof typeof PRICING.decoration] ??
    PRICING.decoration.none;

  const setup = "setup" in deco ? (deco.setup as number) : 0;

  if (!slab || qty < MOQ) {
    return {
      qty,
      slab: null,
      belowMoq: qty > 0 && qty < MOQ,
      unitLow: 0,
      unitHigh: 0,
      orderLow: 0,
      orderHigh: 0,
      setup,
      breakdown: [],
      configured: PRICING.configured,
    };
  }

  const base = fabric.rate * product.consumption;
  const decorationCost = deco.rate * input.positions;
  const subtotal = base + product.process + decorationCost;
  const unit = subtotal * (1 + PRICING.margin) * slab.multiplier;

  const unitLow = unit * (1 - PRICING.spread);
  const unitHigh = unit * (1 + PRICING.spread);

  return {
    qty,
    slab: { label: slab.label, multiplier: slab.multiplier },
    belowMoq: false,
    unitLow,
    unitHigh,
    orderLow: unitLow * qty + setup,
    orderHigh: unitHigh * qty + setup,
    setup,
    configured: PRICING.configured,
    breakdown: [
      { label: "Fabric", value: fabric.label },
      { label: "Product", value: product.label },
      { label: "Branding", value: deco.rate === 0 ? "None" : `${deco.label} × ${input.positions}` },
      { label: "Quantity slab", value: slab.label },
    ],
  };
}
