/**
 * Session auth for /admin.
 *
 * scrypt password comparison, random session id stored server-side in SQLite,
 * httpOnly + sameSite cookie. No third-party dependency.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE = "ca_admin";
const TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

/**
 * Credentials.
 *
 * The demo default is documented publicly in the README, so shipping with it
 * is equivalent to having no password at all. Rather than trust a deployment
 * checklist, the module refuses to load in production without real values.
 */
const DEMO_PASSWORD = "tiruppur2026";
const DEMO_SALT = "custom-apparel-static-salt";

const PASSWORD = process.env.ADMIN_PASSWORD ?? DEMO_PASSWORD;
const SALT = process.env.ADMIN_SALT ?? DEMO_SALT;

/**
 * Checked on every login attempt rather than at module load, because module
 * load also happens during `next build` — where these env vars legitimately
 * are not present yet. Failing at build time would just force everyone to
 * set CA_ALLOW_DEMO_AUTH in CI, which defeats the point.
 */
export function assertSecureConfig() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.CA_ALLOW_DEMO_AUTH === "1") return;

  if (PASSWORD === DEMO_PASSWORD) {
    throw new Error(
      "ADMIN_PASSWORD is not set. The demo password is published in the README, " +
        "so admin is effectively open. Set ADMIN_PASSWORD, or CA_ALLOW_DEMO_AUTH=1 to accept the risk."
    );
  }
  if (SALT === DEMO_SALT) {
    throw new Error("ADMIN_SALT is not set. Refusing to authenticate with the demo salt.");
  }
  if (PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
}

/** True when running on published demo credentials — surfaced in the UI. */
export function usingDemoCredentials() {
  return PASSWORD === DEMO_PASSWORD || SALT === DEMO_SALT;
}

function hash(pw: string) {
  return scryptSync(pw, SALT, 32);
}

export function verifyPassword(input: string) {
  assertSecureConfig();
  const a = hash(input);
  const b = hash(PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession() {
  const id = randomBytes(24).toString("hex");
  const now = Date.now();
  db.prepare(`INSERT INTO sessions (id, created_at, expires_at) VALUES (?,?,?)`).run(
    id,
    new Date(now).toISOString(),
    new Date(now + TTL_MS).toISOString()
  );
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
  return id;
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
  jar.delete(COOKIE);
}

export async function isAuthed() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return false;
  const row = db.prepare(`SELECT expires_at FROM sessions WHERE id = ?`).get(id) as
    | { expires_at: string }
    | undefined;
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
    return false;
  }
  return true;
}

/** Housekeeping — drop expired rows opportunistically. */
export function sweepSessions() {
  db.prepare(`DELETE FROM sessions WHERE expires_at < ?`).run(new Date().toISOString());
}
