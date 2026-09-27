/**
 * Buyer portal — passwordless.
 *
 * WHY NO REGISTRATION FORM
 * A B2B buyer wanting a rate will not create an account first. None of the
 * nine competitor sites reviewed gate quoting behind a login, and they are
 * right not to. Registration before value is the single most reliable way to
 * lose an enquiry.
 *
 * So the account is never *created* by the buyer — it already exists the
 * moment they submit an RFQ, keyed to the phone number they gave us. They
 * prove ownership of that number with a one-time code and get in. Nothing to
 * sign up for, nothing to remember, nothing to reset.
 */
import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import type { Rfq } from "./rfq";

const COOKIE = "ca_buyer";
const CODE_TTL_MS = 10 * 60_000;      // 10 minutes
const SESSION_TTL_MS = 30 * 864e5;    // 30 days — this is low-risk, read-mostly data
const MAX_ATTEMPTS = 5;

db.exec(`
  CREATE TABLE IF NOT EXISTS buyer_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    phone      TEXT    NOT NULL,
    code_hash  TEXT    NOT NULL,
    created_at TEXT    NOT NULL,
    expires_at TEXT    NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    attempts   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS buyer_sessions (
    id         TEXT PRIMARY KEY,
    phone      TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_codes_phone    ON buyer_codes(phone, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_phone ON buyer_sessions(phone);
`);

/**
 * Indian mobiles get written as 9876543210, +91 98765 43210, 09876543210…
 * Comparing the last 10 digits makes all of those the same buyer.
 */
export function normalisePhone(raw: string) {
  const digits = String(raw).replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

/** Does any RFQ exist for this number? We never reveal the answer publicly. */
export function buyerExists(phone: string) {
  const p = normalisePhone(phone);
  if (p.length < 10) return false;
  const row = db
    .prepare(`SELECT COUNT(*) n FROM rfqs WHERE REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'+','') LIKE ?`)
    .get(`%${p}`) as { n: number };
  return row.n > 0;
}

export function issueCode(phone: string) {
  const p = normalisePhone(phone);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = Date.now();

  // Invalidate anything outstanding so only the newest code works.
  db.prepare(`UPDATE buyer_codes SET used = 1 WHERE phone = ? AND used = 0`).run(p);
  db.prepare(
    `INSERT INTO buyer_codes (phone, code_hash, created_at, expires_at) VALUES (?,?,?,?)`
  ).run(p, hash(code), new Date(now).toISOString(), new Date(now + CODE_TTL_MS).toISOString());

  return code;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "too_many" | "wrong" };

export function verifyCode(phone: string, code: string): VerifyResult {
  const p = normalisePhone(phone);
  const row = db
    .prepare(
      `SELECT * FROM buyer_codes WHERE phone = ? AND used = 0 ORDER BY created_at DESC LIMIT 1`
    )
    .get(p) as
    | { id: number; code_hash: string; expires_at: string; attempts: number }
    | undefined;

  if (!row) return { ok: false, reason: "no_code" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many" };

  db.prepare(`UPDATE buyer_codes SET attempts = attempts + 1 WHERE id = ?`).run(row.id);

  const a = Buffer.from(hash(String(code).trim()));
  const b = Buffer.from(row.code_hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "wrong" };

  db.prepare(`UPDATE buyer_codes SET used = 1 WHERE id = ?`).run(row.id);
  return { ok: true };
}

export async function startSession(phone: string) {
  const p = normalisePhone(phone);
  const id = randomBytes(24).toString("hex");
  const now = Date.now();
  db.prepare(
    `INSERT INTO buyer_sessions (id, phone, created_at, expires_at) VALUES (?,?,?,?)`
  ).run(id, p, new Date(now).toISOString(), new Date(now + SESSION_TTL_MS).toISOString());

  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return id;
}

export async function endSession() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) db.prepare(`DELETE FROM buyer_sessions WHERE id = ?`).run(id);
  jar.delete(COOKIE);
}

/** The signed-in buyer's normalised phone, or null. */
export async function currentBuyer() {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const row = db.prepare(`SELECT phone, expires_at FROM buyer_sessions WHERE id = ?`).get(id) as
    | { phone: string; expires_at: string }
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare(`DELETE FROM buyer_sessions WHERE id = ?`).run(id);
    return null;
  }
  return row.phone;
}

/** Every enquiry belonging to a phone number, newest first. */
export function ordersFor(phone: string): Rfq[] {
  const p = normalisePhone(phone);
  const rows = db
    .prepare(
      `SELECT * FROM rfqs
       WHERE REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'+','') LIKE ?
       ORDER BY created_at DESC`
    )
    .all(`%${p}`) as Rfq[];

  return rows.map((r) => ({
    ...r,
    lines: (db
      .prepare(`SELECT * FROM rfq_lines WHERE rfq_id = ? ORDER BY idx`)
      .all(r.id) as (Omit<NonNullable<Rfq["lines"]>[number], "sizes"> & { sizes: string })[])
      .map((l) => ({ ...l, sizes: JSON.parse(l.sizes) })),
    events: db
      .prepare(`SELECT * FROM rfq_events WHERE rfq_id = ? ORDER BY at DESC`)
      .all(r.id) as NonNullable<Rfq["events"]>,
  }));
}

/** One order, scoped to the signed-in buyer. Used by reorder. */
export function orderFor(phone: string, ref: string) {
  return ordersFor(phone).find((r) => r.ref.toLowerCase() === ref.trim().toLowerCase()) ?? null;
}

export function sweepPortal() {
  const now = new Date().toISOString();
  db.prepare(`DELETE FROM buyer_codes WHERE expires_at < ?`).run(now);
  db.prepare(`DELETE FROM buyer_sessions WHERE expires_at < ?`).run(now);
}
