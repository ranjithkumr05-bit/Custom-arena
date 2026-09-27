/**
 * SQLite persistence layer.
 *
 * Migrations are applied on first import and are idempotent, so the process
 * can restart against an existing file safely. WAL is enabled for concurrent
 * reads while a write is in flight.
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __caDb: Database.Database | undefined;
}

function open() {
  const db = new Database(path.join(DATA_DIR, "customapparel.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

/**
 * SQLite has no `ADD COLUMN IF NOT EXISTS`, so columns are added by
 * inspecting the table first. Keeps migrations additive and re-runnable.
 */
function addColumns(db: Database.Database, table: string, cols: Record<string, string>) {
  const have = new Set(
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name)
  );
  for (const [name, decl] of Object.entries(cols)) {
    if (!have.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${decl}`);
  }
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rfqs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      ref          TEXT    NOT NULL UNIQUE,
      created_at   TEXT    NOT NULL,
      updated_at   TEXT    NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'new',
      source       TEXT    NOT NULL DEFAULT 'website',
      kind         TEXT    NOT NULL DEFAULT 'quote',
      name         TEXT    NOT NULL,
      organisation TEXT    NOT NULL DEFAULT '',
      phone        TEXT    NOT NULL,
      email        TEXT    NOT NULL DEFAULT '',
      city         TEXT    NOT NULL DEFAULT '',
      buyer_type   TEXT    NOT NULL DEFAULT '',
      colour       TEXT    NOT NULL DEFAULT '',
      required_by  TEXT    NOT NULL DEFAULT '',
      notes        TEXT    NOT NULL DEFAULT '',
      qty          INTEGER NOT NULL DEFAULT 0,
      est_low      INTEGER NOT NULL DEFAULT 0,
      est_high     INTEGER NOT NULL DEFAULT 0,
      score        INTEGER NOT NULL DEFAULT 0,
      priority     TEXT    NOT NULL DEFAULT 'low'
    );

    CREATE TABLE IF NOT EXISTS rfq_lines (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id      INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
      idx         INTEGER NOT NULL DEFAULT 0,
      product     TEXT    NOT NULL,
      fabric      TEXT    NOT NULL,
      decoration  TEXT    NOT NULL,
      positions   INTEGER NOT NULL DEFAULT 1,
      colour      TEXT    NOT NULL DEFAULT '',
      sizes       TEXT    NOT NULL DEFAULT '{}',
      qty         INTEGER NOT NULL DEFAULT 0,
      est_low     INTEGER NOT NULL DEFAULT 0,
      est_high    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS rfq_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id      INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
      at          TEXT    NOT NULL,
      type        TEXT    NOT NULL,
      actor       TEXT    NOT NULL DEFAULT 'system',
      from_status TEXT    NOT NULL DEFAULT '',
      to_status   TEXT    NOT NULL DEFAULT '',
      note        TEXT    NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rfqs_status  ON rfqs(status);
    CREATE INDEX IF NOT EXISTS idx_rfqs_created ON rfqs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_lines_rfq    ON rfq_lines(rfq_id);
    CREATE TABLE IF NOT EXISTS rfq_files (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id        INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
      claim_token   TEXT    NOT NULL,
      filename      TEXT    NOT NULL,
      original_name TEXT    NOT NULL DEFAULT '',
      url           TEXT    NOT NULL,
      mime          TEXT    NOT NULL DEFAULT '',
      bytes         INTEGER NOT NULL DEFAULT 0,
      width         INTEGER NOT NULL DEFAULT 0,
      height        INTEGER NOT NULL DEFAULT 0,
      colours       INTEGER NOT NULL DEFAULT 0,
      placeholder   TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_rfq   ON rfq_events(rfq_id, at DESC);
    CREATE INDEX IF NOT EXISTS idx_files_rfq    ON rfq_files(rfq_id);
    CREATE INDEX IF NOT EXISTS idx_files_claim  ON rfq_files(claim_token);
  `);

  // Marketing attribution, added after the initial schema shipped.
  addColumns(db, "rfqs", {
    utm_source:   "TEXT NOT NULL DEFAULT ''",
    utm_medium:   "TEXT NOT NULL DEFAULT ''",
    utm_campaign: "TEXT NOT NULL DEFAULT ''",
    utm_term:     "TEXT NOT NULL DEFAULT ''",
    utm_content:  "TEXT NOT NULL DEFAULT ''",
    referrer:     "TEXT NOT NULL DEFAULT ''",
    landing_page: "TEXT NOT NULL DEFAULT ''",
    click_id:     "TEXT NOT NULL DEFAULT ''",
    device:       "TEXT NOT NULL DEFAULT ''",
    touches:      "INTEGER NOT NULL DEFAULT 0",
  });

  db.exec(`CREATE INDEX IF NOT EXISTS idx_rfqs_source ON rfqs(utm_source)`);
}

export const db = globalThis.__caDb ?? (globalThis.__caDb = open());

/* ------------------------------------------------------------------ */

export {
  STATUSES,
  STATUS_LABEL,
  STATUS_STAGE_SLUG,
} from "./rfq";
export type { Status, Rfq, RfqLine, RfqEvent, Stats } from "./rfq";

import type { Rfq, RfqLine, RfqEvent, Status } from "./rfq";

/* ---------------------------- scoring ---------------------------- */

export function scoreLead(r: {
  qty: number;
  organisation?: string;
  email?: string;
  required_by?: string;
  buyer_type?: string;
}) {
  let s = 0;
  if (r.qty >= 500) s += 40;
  else if (r.qty >= 100) s += 25;
  else if (r.qty >= 50) s += 15;
  else s += 5;
  if (r.organisation) s += 15;
  if (r.email) s += 10;
  if (r.required_by) s += 15;
  if (["Company / corporate", "School or college", "Brand / private label"].includes(r.buyer_type ?? "")) s += 15;
  const priority = s >= 60 ? "high" : s >= 35 ? "medium" : "low";
  return { score: s, priority };
}

/* ---------------------------- queries ---------------------------- */

function nextRef(): string {
  const d = new Date();
  const ym = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM rfqs WHERE ref LIKE ?`)
    .get(`CA-${ym}-%`) as { n: number };
  return `CA-${ym}-${String(row.n + 1).padStart(4, "0")}`;
}

export interface Attribution {
  utm_source?: string; utm_medium?: string; utm_campaign?: string;
  utm_term?: string; utm_content?: string; referrer?: string;
  landing_page?: string; click_id?: string; device?: string; touches?: number;
}

export interface CreateRfqInput {
  kind?: string;
  source?: string;
  name: string;
  organisation?: string;
  phone: string;
  email?: string;
  city?: string;
  buyerType?: string;
  colour?: string;
  requiredBy?: string;
  notes?: string;
  lines: Omit<RfqLine, "id" | "idx">[];
  attribution?: Attribution;
}

export const createRfq = db.transaction((input: CreateRfqInput): Rfq => {
  const now = new Date().toISOString();
  const ref = nextRef();

  const qty = input.lines.reduce((a, l) => a + l.qty, 0);
  const estLow = input.lines.reduce((a, l) => a + l.est_low * l.qty, 0);
  const estHigh = input.lines.reduce((a, l) => a + l.est_high * l.qty, 0);

  const { score, priority } = scoreLead({
    qty,
    organisation: input.organisation,
    email: input.email,
    required_by: input.requiredBy,
    buyer_type: input.buyerType,
  });

  const info = db
    .prepare(
      `INSERT INTO rfqs
       (ref, created_at, updated_at, status, source, kind, name, organisation, phone,
        email, city, buyer_type, colour, required_by, notes, qty, est_low, est_high,
        score, priority, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        referrer, landing_page, click_id, device, touches)
       VALUES (@ref,@now,@now,'new',@source,@kind,@name,@organisation,@phone,
               @email,@city,@buyerType,@colour,@requiredBy,@notes,@qty,@estLow,@estHigh,
               @score,@priority,@utmSource,@utmMedium,@utmCampaign,@utmTerm,@utmContent,
               @referrer,@landingPage,@clickId,@device,@touches)`
    )
    .run({
      ref, now,
      source: input.source ?? "website",
      kind: input.kind ?? "quote",
      name: input.name,
      organisation: input.organisation ?? "",
      phone: input.phone,
      email: input.email ?? "",
      city: input.city ?? "",
      buyerType: input.buyerType ?? "",
      colour: input.colour ?? "",
      requiredBy: input.requiredBy ?? "",
      notes: input.notes ?? "",
      qty, estLow: Math.round(estLow), estHigh: Math.round(estHigh),
      score, priority,
      utmSource: input.attribution?.utm_source ?? "",
      utmMedium: input.attribution?.utm_medium ?? "",
      utmCampaign: input.attribution?.utm_campaign ?? "",
      utmTerm: input.attribution?.utm_term ?? "",
      utmContent: input.attribution?.utm_content ?? "",
      referrer: input.attribution?.referrer ?? "",
      landingPage: input.attribution?.landing_page ?? "",
      clickId: input.attribution?.click_id ?? "",
      device: input.attribution?.device ?? "",
      touches: input.attribution?.touches ?? 0,
    });

  const rfqId = Number(info.lastInsertRowid);

  const insLine = db.prepare(
    `INSERT INTO rfq_lines (rfq_id, idx, product, fabric, decoration, positions, colour, sizes, qty, est_low, est_high)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  );
  input.lines.forEach((l, i) =>
    insLine.run(rfqId, i, l.product, l.fabric, l.decoration, l.positions,
      l.colour ?? "", JSON.stringify(l.sizes), l.qty, Math.round(l.est_low), Math.round(l.est_high))
  );

  addEvent(rfqId, {
    type: "created",
    actor: "buyer",
    to_status: "new",
    note: `${input.lines.length} line${input.lines.length > 1 ? "s" : ""}, ${qty} pieces`,
  });

  return getRfqById(rfqId)!;
});

export interface RfqFile {
  id: number; rfq_id: number | null; claim_token: string;
  filename: string; original_name: string; url: string; mime: string;
  bytes: number; width: number; height: number; colours: number;
  placeholder: string; created_at: string;
}

export function addRfqFile(f: Omit<RfqFile, "id" | "rfq_id" | "created_at">) {
  const info = db.prepare(
    `INSERT INTO rfq_files (claim_token, filename, original_name, url, mime, bytes, width, height, colours, placeholder, created_at)
     VALUES (@claim_token,@filename,@original_name,@url,@mime,@bytes,@width,@height,@colours,@placeholder,@created_at)`
  ).run({ ...f, created_at: new Date().toISOString() });
  return db.prepare(`SELECT * FROM rfq_files WHERE id = ?`).get(Number(info.lastInsertRowid)) as RfqFile;
}

/**
 * Attach uploads to an RFQ.
 *
 * Files are uploaded before the enquiry exists, so each carries a random
 * claim token. Only rows matching BOTH the id and the token, and not already
 * claimed, are linked — so a guessed id cannot steal someone else's artwork.
 */
export function claimFiles(rfqId: number, ids: number[], token: string) {
  if (!ids.length || !token) return [];
  const stmt = db.prepare(
    `UPDATE rfq_files SET rfq_id = ? WHERE id = ? AND claim_token = ? AND rfq_id IS NULL`
  );
  for (const id of ids) stmt.run(rfqId, id, token);
  return filesForRfq(rfqId);
}

export function filesForRfq(rfqId: number) {
  return db.prepare(`SELECT * FROM rfq_files WHERE rfq_id = ? ORDER BY id`).all(rfqId) as RfqFile[];
}

/** Uploads never attached to an enquiry are swept after 24h. */
export function sweepOrphanFiles() {
  const cutoff = new Date(Date.now() - 864e5).toISOString();
  const rows = db.prepare(
    `SELECT * FROM rfq_files WHERE rfq_id IS NULL AND created_at < ?`
  ).all(cutoff) as RfqFile[];
  if (rows.length) {
    db.prepare(`DELETE FROM rfq_files WHERE rfq_id IS NULL AND created_at < ?`).run(cutoff);
  }
  return rows;
}

export function addEvent(
  rfqId: number,
  e: { type: string; actor?: string; from_status?: string; to_status?: string; note?: string }
) {
  db.prepare(
    `INSERT INTO rfq_events (rfq_id, at, type, actor, from_status, to_status, note)
     VALUES (?,?,?,?,?,?,?)`
  ).run(rfqId, new Date().toISOString(), e.type, e.actor ?? "system",
    e.from_status ?? "", e.to_status ?? "", e.note ?? "");
}

function hydrate(r: Rfq): Rfq {
  const lines = db
    .prepare(`SELECT * FROM rfq_lines WHERE rfq_id = ? ORDER BY idx`)
    .all(r.id) as (Omit<RfqLine, "sizes"> & { sizes: string })[];
  const events = db
    .prepare(`SELECT * FROM rfq_events WHERE rfq_id = ? ORDER BY at DESC, id DESC`)
    .all(r.id) as RfqEvent[];
  return {
    ...r,
    lines: lines.map((l) => ({ ...l, sizes: JSON.parse(l.sizes) })),
    events,
    files: filesForRfq(r.id),
  };
}

export function getRfqById(id: number): Rfq | null {
  const r = db.prepare(`SELECT * FROM rfqs WHERE id = ?`).get(id) as Rfq | undefined;
  return r ? hydrate(r) : null;
}

export function getRfqByRef(ref: string): Rfq | null {
  const r = db
    .prepare(`SELECT * FROM rfqs WHERE ref = ? COLLATE NOCASE`)
    .get(ref.trim()) as Rfq | undefined;
  return r ? hydrate(r) : null;
}

export function listRfqs(opts: { status?: string; q?: string; limit?: number } = {}) {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (opts.status && opts.status !== "all") {
    where.push("status = @status");
    params.status = opts.status;
  }
  if (opts.q) {
    where.push("(ref LIKE @q OR name LIKE @q OR organisation LIKE @q OR phone LIKE @q OR city LIKE @q)");
    params.q = `%${opts.q}%`;
  }
  const sql = `SELECT * FROM rfqs ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY created_at DESC LIMIT @limit`;
  params.limit = opts.limit ?? 200;
  const rows = db.prepare(sql).all(params) as Rfq[];
  return rows.map(hydrate);
}

export function updateStatus(ref: string, to: Status, note = "", actor = "admin") {
  const r = getRfqByRef(ref);
  if (!r) return null;
  if (r.status === to && !note) return r;
  db.prepare(`UPDATE rfqs SET status = ?, updated_at = ? WHERE id = ?`)
    .run(to, new Date().toISOString(), r.id);
  addEvent(r.id, {
    type: r.status === to ? "note" : "status_change",
    actor,
    from_status: r.status,
    to_status: to,
    note,
  });
  return getRfqById(r.id);
}

export function stats() {
  const total = (db.prepare(`SELECT COUNT(*) n FROM rfqs`).get() as { n: number }).n;
  const pieces = (db.prepare(`SELECT COALESCE(SUM(qty),0) n FROM rfqs`).get() as { n: number }).n;
  const open = (db.prepare(
    `SELECT COUNT(*) n FROM rfqs WHERE status NOT IN ('closed','lost')`
  ).get() as { n: number }).n;
  const byStatus = db
    .prepare(`SELECT status, COUNT(*) n FROM rfqs GROUP BY status`)
    .all() as { status: Status; n: number }[];
  const value = (db.prepare(
    `SELECT COALESCE(SUM(est_low),0) lo, COALESCE(SUM(est_high),0) hi
     FROM rfqs WHERE status NOT IN ('closed','lost')`
  ).get() as { lo: number; hi: number });
  return { total, pieces, open, byStatus, value };
}
