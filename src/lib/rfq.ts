/**
 * Shared RFQ types and constants.
 *
 * Deliberately free of any Node-only import so client components can use it
 * without pulling the database driver into the browser bundle.
 */

export const STATUSES = [
  "new",
  "contacted",
  "quoted",
  "sampling",
  "in_production",
  "dispatched",
  "closed",
  "lost",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  sampling: "Sampling",
  in_production: "In production",
  dispatched: "Dispatched",
  closed: "Closed",
  lost: "Lost",
};

/**
 * Which production stage a status corresponds to, keyed by SLUG.
 *
 * This used to be hardcoded indices (in_production: 3, dispatched: 7). The
 * moment the process changed from 8 stages to 6, every one of those numbers
 * pointed at the wrong stage — silently, since an index is always "valid".
 * Slugs fail loudly and survive reordering.
 */
export const STATUS_STAGE_SLUG: Record<Status, string | null> = {
  new: null,
  contacted: null,
  quoted: null,
  sampling: "fabric-sourcing",
  in_production: "branding",
  dispatched: "packing-dispatch",
  closed: "packing-dispatch",
  lost: null,
};

export interface RfqLine {
  id?: number;
  idx: number;
  product: string;
  fabric: string;
  decoration: string;
  positions: number;
  colour: string;
  sizes: Record<string, number>;
  qty: number;
  est_low: number;
  est_high: number;
}

export interface RfqEvent {
  id: number;
  at: string;
  type: string;
  actor: string;
  from_status: string;
  to_status: string;
  note: string;
}

export interface Rfq {
  id: number;
  ref: string;
  created_at: string;
  updated_at: string;
  status: Status;
  source: string;
  kind: string;
  name: string;
  organisation: string;
  phone: string;
  email: string;
  city: string;
  buyer_type: string;
  colour: string;
  required_by: string;
  notes: string;
  qty: number;
  est_low: number;
  est_high: number;
  score: number;
  priority: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  referrer: string;
  landing_page: string;
  click_id: string;
  device: string;
  touches: number;
  lines?: RfqLine[];
  events?: RfqEvent[];
  files?: RfqFileRef[];
}

export interface RfqFileRef {
  id: number;
  url: string;
  original_name: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  colours: number;
  placeholder: string;
}

export interface Stats {
  total: number;
  pieces: number;
  open: number;
  byStatus: { status: Status; n: number }[];
  value: { lo: number; hi: number };
}
