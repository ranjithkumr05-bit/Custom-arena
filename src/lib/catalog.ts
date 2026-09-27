/**
 * Catalog CMS — server only.
 *
 * ARCHITECTURE
 * `content/categories.json` stays the seed/default. It is version-controlled,
 * reviewable in a pull request, and is what a fresh install boots with.
 * Anything edited in the admin is written to `catalog_overrides` as a sparse
 * patch keyed by entity. Reads merge default <- override.
 *
 * Why not edit the JSON directly (the Strapi-style "content is the database"
 * approach)? Because a writable JSON file in the repo means every edit is a
 * merge conflict, there is no audit trail, and a bad save corrupts the seed
 * with no way back. With an overlay, `DELETE` on a row restores the original
 * instantly, and the seed is always intact.
 */
import "server-only";
import { db } from "./db";
import rawCategories from "../../content/categories.json";

/* ------------------------------------------------------------------ */
/* schema                                                              */
/* ------------------------------------------------------------------ */

db.exec(`
  CREATE TABLE IF NOT EXISTS media (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    filename      TEXT    NOT NULL UNIQUE,
    original_name TEXT    NOT NULL DEFAULT '',
    url           TEXT    NOT NULL,
    mime          TEXT    NOT NULL DEFAULT '',
    bytes         INTEGER NOT NULL DEFAULT 0,
    width         INTEGER NOT NULL DEFAULT 0,
    height        INTEGER NOT NULL DEFAULT 0,
    alt           TEXT    NOT NULL DEFAULT '',
    placeholder   TEXT    NOT NULL DEFAULT '',
    folder        TEXT    NOT NULL DEFAULT 'general',
    created_at    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS catalog_overrides (
    key        TEXT PRIMARY KEY,
    kind       TEXT NOT NULL,
    patch      TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS catalog_events (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    at     TEXT NOT NULL,
    actor  TEXT NOT NULL DEFAULT 'admin',
    key    TEXT NOT NULL,
    field  TEXT NOT NULL,
    old_v  TEXT NOT NULL DEFAULT '',
    new_v  TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_media_folder  ON media(folder, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_cat_events    ON catalog_events(key, at DESC);
`);

/* ------------------------------------------------------------------ */
/* types                                                               */
/* ------------------------------------------------------------------ */

export interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  alt: string;
  placeholder: string;
  folder: string;
  created_at: string;
}

export interface SubPatch {
  title?: string;
  blurb?: string;
  image?: string;
  sort?: number;
  published?: boolean;
}
export interface CatPatch extends SubPatch {
  hero?: string;
  heroAlt?: string;
  summary?: string;
  intro?: string;
}

type RawCat = (typeof rawCategories)[number];
type RawSub = RawCat["subcategories"][number];

export type ResolvedSub = RawSub & {
  published: boolean;
  sort: number;
  edited: boolean;
  parentSlug: string;
  /**
   * True while this subcategory is still showing a shared fallback image.
   *
   * Derived, never stored. The seed marks which entries shipped without
   * bespoke art; the moment an override supplies an image, this flips to
   * false on its own. Storing it would mean the admin had to remember to
   * clear a flag in a file it deliberately cannot write to.
   */
  needsArt: boolean;
};
export type ResolvedCat = Omit<RawCat, "subcategories"> & {
  published: boolean;
  sort: number;
  edited: boolean;
  subcategories: ResolvedSub[];
};

/* ------------------------------------------------------------------ */
/* keys                                                                */
/* ------------------------------------------------------------------ */

export const catKey = (slug: string) => `cat:${slug}`;
export const subKey = (cat: string, sub: string) => `sub:${cat}/${sub}`;

function loadPatches() {
  const rows = db
    .prepare(`SELECT key, patch FROM catalog_overrides`)
    .all() as { key: string; patch: string }[];
  const m = new Map<string, CatPatch>();
  for (const r of rows) {
    try { m.set(r.key, JSON.parse(r.patch)); } catch { /* skip corrupt row */ }
  }
  return m;
}

/* ------------------------------------------------------------------ */
/* read                                                                */
/* ------------------------------------------------------------------ */

/** Full catalog including unpublished entries. Admin use. */
export function resolveCatalog(): ResolvedCat[] {
  const patches = loadPatches();

  return (rawCategories as RawCat[])
    .map((c, ci) => {
      const p = patches.get(catKey(c.slug)) ?? {};
      const subs = c.subcategories
        .map((s, si) => {
          const sp = patches.get(subKey(c.slug, s.slug)) ?? {};
          const seedPending = (s as { imagePending?: boolean }).imagePending === true;
          return {
            ...s,
            ...sp,
            parentSlug: c.slug,
            published: sp.published ?? true,
            sort: sp.sort ?? si,
            edited: Object.keys(sp).length > 0,
            needsArt: seedPending && !sp.image,
          } as ResolvedSub;
        })
        .sort((a, b) => a.sort - b.sort);

      return {
        ...c,
        ...p,
        subcategories: subs,
        published: p.published ?? true,
        sort: p.sort ?? ci,
        edited: Object.keys(p).length > 0,
      } as ResolvedCat;
    })
    .sort((a, b) => a.sort - b.sort);
}

/** Published-only view. Everything public reads through this. */
export function publicCatalog(): ResolvedCat[] {
  return resolveCatalog()
    .filter((c) => c.published)
    .map((c) => ({ ...c, subcategories: c.subcategories.filter((s) => s.published) }));
}

export function publicCategory(slug: string) {
  return publicCatalog().find((c) => c.slug === slug) ?? null;
}

export function publicSub(catSlug: string, subSlug: string) {
  const cat = publicCategory(catSlug);
  const sub = cat?.subcategories.find((s) => s.slug === subSlug);
  return cat && sub ? { cat, sub } : null;
}

export function allPublicSubs() {
  return publicCatalog().flatMap((c) => c.subcategories.map((s) => ({ cat: c, sub: s })));
}

/* ------------------------------------------------------------------ */
/* write                                                               */
/* ------------------------------------------------------------------ */

const ALLOWED_CAT = new Set(["title", "summary", "intro", "hero", "heroAlt", "sort", "published"]);
const ALLOWED_SUB = new Set(["title", "blurb", "image", "sort", "published"]);

export function savePatch(
  key: string,
  kind: "category" | "subcategory",
  incoming: Record<string, unknown>,
  actor = "admin"
) {
  const allowed = kind === "category" ? ALLOWED_CAT : ALLOWED_SUB;
  const row = db.prepare(`SELECT patch FROM catalog_overrides WHERE key = ?`).get(key) as
    | { patch: string }
    | undefined;
  const current: Record<string, unknown> = row ? JSON.parse(row.patch) : {};

  const next = { ...current };
  for (const [k, v] of Object.entries(incoming)) {
    if (!allowed.has(k)) continue;
    // Empty string means "revert this field to the seed value".
    if (v === "" || v === null || v === undefined) delete next[k];
    else next[k] = v;
    if (String(current[k] ?? "") !== String(v ?? "")) {
      db.prepare(
        `INSERT INTO catalog_events (at, actor, key, field, old_v, new_v) VALUES (?,?,?,?,?,?)`
      ).run(new Date().toISOString(), actor, key, k, String(current[k] ?? ""), String(v ?? ""));
    }
  }

  if (Object.keys(next).length === 0) {
    db.prepare(`DELETE FROM catalog_overrides WHERE key = ?`).run(key);
  } else {
    db.prepare(
      `INSERT INTO catalog_overrides (key, kind, patch, updated_at) VALUES (?,?,?,?)
       ON CONFLICT(key) DO UPDATE SET patch = excluded.patch, updated_at = excluded.updated_at`
    ).run(key, kind, JSON.stringify(next), new Date().toISOString());
  }
  return next;
}

/** Drop all edits for an entity, restoring the seed exactly. */
export function resetPatch(key: string, actor = "admin") {
  db.prepare(
    `INSERT INTO catalog_events (at, actor, key, field, old_v, new_v) VALUES (?,?,?,?,?,?)`
  ).run(new Date().toISOString(), actor, key, "*", "override", "reset to default");
  db.prepare(`DELETE FROM catalog_overrides WHERE key = ?`).run(key);
}

export function catalogHistory(limit = 40) {
  return db
    .prepare(`SELECT * FROM catalog_events ORDER BY at DESC, id DESC LIMIT ?`)
    .all(limit) as {
    id: number; at: string; actor: string; key: string; field: string; old_v: string; new_v: string;
  }[];
}

/* ------------------------------------------------------------------ */
/* media                                                               */
/* ------------------------------------------------------------------ */

export function addMedia(m: Omit<MediaItem, "id" | "created_at">) {
  const info = db
    .prepare(
      `INSERT INTO media (filename, original_name, url, mime, bytes, width, height, alt, placeholder, folder, created_at)
       VALUES (@filename,@original_name,@url,@mime,@bytes,@width,@height,@alt,@placeholder,@folder,@created_at)`
    )
    .run({ ...m, created_at: new Date().toISOString() });
  return getMedia(Number(info.lastInsertRowid))!;
}

export function getMedia(id: number) {
  return (db.prepare(`SELECT * FROM media WHERE id = ?`).get(id) as MediaItem) ?? null;
}

export function listMedia(folder?: string) {
  return folder && folder !== "all"
    ? (db.prepare(`SELECT * FROM media WHERE folder = ? ORDER BY created_at DESC`).all(folder) as MediaItem[])
    : (db.prepare(`SELECT * FROM media ORDER BY created_at DESC`).all() as MediaItem[]);
}

export function deleteMedia(id: number) {
  const m = getMedia(id);
  if (m) db.prepare(`DELETE FROM media WHERE id = ?`).run(id);
  return m;
}

export function mediaFolders() {
  return (db.prepare(`SELECT folder, COUNT(*) n FROM media GROUP BY folder ORDER BY folder`).all() as
    { folder: string; n: number }[]);
}

/** Live count of subcategories still on a shared image. */
export function artProgress() {
  const subs = resolveCatalog().flatMap((c) => c.subcategories);
  const pending = subs.filter((s) => s.needsArt).length;
  return { total: subs.length, pending, done: subs.length - pending };
}

/** Images shipped in the repo, so the picker is useful before any upload. */
export function seedImages() {
  const seen = new Set<string>();
  const out: { url: string; label: string }[] = [];
  for (const c of rawCategories as RawCat[]) {
    if (!seen.has(c.hero)) { seen.add(c.hero); out.push({ url: c.hero, label: c.title }); }
    for (const s of c.subcategories) {
      if (!seen.has(s.image)) { seen.add(s.image); out.push({ url: s.image, label: s.title }); }
    }
  }
  return out;
}
