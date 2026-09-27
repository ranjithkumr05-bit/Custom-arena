/**
 * Minimal file-backed CRM store.
 *
 * Deliberately dependency-free so it runs anywhere. For production, swap the
 * read/write functions for Postgres, Supabase or your existing backend — the
 * interface below is all the rest of the app depends on.
 */
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "rfqs.json");

export type RfqStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "sampling"
  | "in_production"
  | "dispatched"
  | "closed"
  | "lost";

export interface Rfq {
  ref: string;
  createdAt: string;
  status: RfqStatus;
  source: string;

  name: string;
  organisation: string;
  phone: string;
  email: string;
  city: string;
  buyerType: string;

  product: string;
  fabric: string;
  decoration: string;
  positions: number;
  sizes: Record<string, number>;
  qty: number;
  colour: string;
  requiredBy: string;
  notes: string;

  estimateLow: number;
  estimateHigh: number;
}

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

export async function listRfqs(): Promise<Rfq[]> {
  await ensure();
  const raw = await fs.readFile(FILE, "utf8");
  try {
    const rows = JSON.parse(raw) as Rfq[];
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function addRfq(r: Omit<Rfq, "ref" | "createdAt" | "status">) {
  await ensure();
  const rows = await listRfqs();
  const ref = makeRef(rows.length + 1);
  const row: Rfq = {
    ...r,
    ref,
    createdAt: new Date().toISOString(),
    status: "new",
  };
  rows.unshift(row);
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
  return row;
}

export async function findRfq(ref: string) {
  const rows = await listRfqs();
  return rows.find((r) => r.ref.toLowerCase() === ref.trim().toLowerCase()) ?? null;
}

function makeRef(n: number) {
  const d = new Date();
  const ym = `${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `CA-${ym}-${String(n).padStart(4, "0")}`;
}

/** Fire-and-forget POST to n8n. Never blocks or fails the user's request. */
export async function notifyN8n(payload: unknown) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return { sent: false, reason: "N8N_WEBHOOK_URL not set" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return { sent: res.ok, status: res.status };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}
