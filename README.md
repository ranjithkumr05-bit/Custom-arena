# CustomWear

B2B knitwear manufacturing site for a family-run unit in Tiruppur, Tamil Nadu.
Corporate apparel, sports jerseys, school uniform t-shirts, workwear, shop
staff wear, hoodies, group tees and private label — quoted and tracked online.

**84 routes · 15,356 lines · Next.js 16 · React 19 · TypeScript strict**

```bash
bash start.sh          # repair whatever is missing, then serve on :3100
bash start.sh --fresh  # force a clean reinstall and rebuild
```

Admin: **`/admin`** — demo password `tiruppur2026`

---

## 1 · Why the site is shaped this way

A buyer choosing a Tiruppur manufacturer is trying to answer three questions:
*can they actually make this, what will it cost, and will they still be
answering the phone in six weeks.* Every structural decision below serves one
of those.

Two rules shaped it more than any feature:

**Nothing unverified is published.** Certifications, capacity, client names,
lead times and payment terms are all absent, not invented. Fields awaiting
real data render an amber marker and are **excluded from structured data**, so
an unconfirmed number cannot leak into schema.org.

**AI imagery is never evidence of the premises.** Generated photography is
used for product, category and material studies. Anything that would claim to
show the actual floor, team or completed orders is left as a marked empty slot
on `/work`, waiting for real photographs.

---

## 2 · Running it

| Command | What it does |
|---|---|
| `bash start.sh` | Inspects what's missing, repairs only that, serves |
| `bash start.sh --fresh` | Wipes `node_modules` + `.next`, full rebuild |
| `npm run dev` | Turbopack dev server, hot reload (~2s per edit) |
| `npm run build && npm start` | Production build |
| `node scripts/seed.mjs` | Seed 8 realistic demo enquiries |

`start.sh` exists because `node_modules`, `.next` and running processes are
reclaimed between sessions while source, content and the database survive. It
frees the port, restores dependencies with `npm ci`, **verifies native modules
actually load** (sharp and better-sqlite3 can be present but broken), builds
if needed, and serves. Warm start is ~160ms; cold is ~2 minutes.

> Use `bash start.sh`, not `./start.sh` — the executable bit does not survive
> snapshots.

---

## 3 · Stack, and what is deliberately absent

```
next 16.3 · react 19.3 · typescript strict · tailwind v4
better-sqlite3 · zod · sharp · motion
```

Seven runtime dependencies. **No ORM, no auth library, no UI kit, no charting
library.** Each was a decision:

| Not used | Instead | Why |
|---|---|---|
| Prisma / Drizzle | `better-sqlite3` + SQL | 10 tables. An ORM is more surface than schema. |
| NextAuth / Clerk | `scrypt` + server-side sessions | Two roles, one password, passwordless buyers. ~180 lines. |
| Radix / Headless UI | 14 hand-built primitives | ~9 KB vs ~60 KB |
| Recharts / Chart.js | Hand-built SVG | ~4 KB vs ~90 KB for four small charts |

`motion` **is** used, for the hero rotator only — `AnimatePresence` keeps the
outgoing slide mounted while it fades, which CSS alone cannot do cleanly.

---

## 4 · How the backend works

### The API layer

Every one of the 10 endpoints goes through a single wrapper, `route()` in
`src/lib/api.ts`, applying the same five controls in the same order:

```
1. Origin check      on POST/PUT/PATCH/DELETE   CSRF defence in depth
2. Rate limit        per IP, per bucket          abuse and brute force
3. Authentication    public | admin | buyer      access control
4. Zod validation    body or query               no unvalidated input
5. Error envelope    catch-all                   no stack traces escape
```

A new endpoint **cannot** ship without them — there is no second way to write
a handler. Handlers receive validated data and express business logic only.

```jsonc
{ "ok": true,  ...data }
{ "ok": false, "error": "Human readable", "errors": { "field": "why" } }
```

### Endpoints

| Method | Path | Auth | Limit | Purpose |
|---|---|---|---|---|
| POST | `/api/rfq` | public | 30/10m + 5 accepted | Submit an enquiry |
| GET | `/api/rfq` | admin | — | List enquiries |
| GET | `/api/track` | public | 10/min | Track one order (**ref + phone last 4**) |
| POST | `/api/attachment` | public | 12/30m | Artwork upload |
| GET | `/api/search` | public | — | Search index |
| POST/GET/DELETE | `/api/portal` | mixed | 12/15m | Passwordless buyer sign-in + orders |
| POST/DELETE | `/api/admin/auth` | public | 8/15m | Admin login / logout |
| POST | `/api/admin/status` | admin | 120/min | Move an RFQ, write audit event |
| GET | `/api/admin/export` | admin | — | CSV export |
| GET/POST/DELETE | `/api/admin/media` | admin | — | Media library |
| GET/POST/DELETE | `/api/admin/catalog` | admin | — | Catalog CMS + revalidation |

### Database — 10 tables, 11 indexes

```
rfqs ──┬── rfq_lines     one enquiry, up to 12 products
       ├── rfq_events    immutable audit trail
       └── rfq_files     artwork, claimed by token

catalog_overrides    sparse patches over the seed JSON
catalog_events       who changed which field, from what, to what
media                uploaded images

sessions             admin, server-side and revocable
buyer_codes          one-time sign-in codes, hashed
buyer_sessions       buyer portal
```

SQLite in WAL mode, foreign keys on, cascade deletes, idempotent migrations
on import. Columns added after launch use a `PRAGMA table_info` check, since
SQLite has no `ADD COLUMN IF NOT EXISTS`.

`createRfq` is a **transaction** — header, every line item and the opening
audit event commit atomically or not at all.

### Validation

Zod enums are generated **from the pricing config**, so an invalid product key
is impossible by construction. Cross-field rules live in `superRefine`:

```
bulk quote   → total ≥ 10 pieces
sample       → intended order ≥ 75 pieces
```

Both enforced server-side, so the UI cannot be bypassed.

### Auth

**Admin** — scrypt hashing, `timingSafeEqual` comparison, server-side session
rows (revocation is immediate), `httpOnly` + `sameSite` cookies, 12h TTL.
`assertSecureConfig()` throws on any production login still using the demo
password, checked at request time so `next build` still works without secrets.

**Buyers** — no registration. The account exists the moment they submit an
enquiry, keyed to their phone number. A 6-digit code proves ownership:
SHA-256 at rest, single-use, 10-minute expiry, 5 attempts, previous codes
invalidated on reissue. Phone numbers are normalised to the last 10 digits, so
`+91 98765 43210` and `09876543210` are the same buyer.

### Notifications

`notifyNewRfq()` fans out to three independent channels in parallel — a slow
one never delays the others or the buyer:

| Channel | Transport |
|---|---|
| WhatsApp | Meta Cloud API |
| Email | Resend |
| Automation | n8n webhook, HMAC-SHA256 signed, backoff retry |

All plain `fetch`. With none configured it logs a loud warning rather than
failing silently — that failure mode loses enquiries.

---

## 5 · Content: a two-layer CMS

`content/*.json` is the **seed** — version controlled, reviewable in a pull
request, and **never written to at runtime**.

Admin edits become sparse patches in `catalog_overrides`. Reads merge
`default ← override`.

```
content/categories.json   (seed, read-only)
          ↓ merge
catalog_overrides         (your edits, SQLite)
          ↓
     what the site shows
```

Deleting one row restores the original **exactly** — verified by checksum.
Strapi-style "content is the database" gives you merge conflicts, no undo and
no audit trail.

| File | Controls |
|---|---|
| `site.json` | Name, contact, location, MOQ, capability flags |
| `categories.json` | 8 categories → 51 subcategories |
| `fabrics.json` · `decoration.json` · `process.json` | Reference tables |
| `faqs.json` · `guides.json` | FAQ + long-form content |
| `pricing.json` | **All calculator rates** |
| `styles.json` | Neck, sleeve and fit options |

Add a category and its page, nav entry, sitemap row, search index entry and
structured data all appear automatically.

### The `confirm` flag

```jsonc
{ "value": "", "confirm": true }
```

Renders an amber marker **and excludes the value from structured data**.
Currently flagged: years trading, capacity, team size, GST, lead times,
payment terms, phone, email, address, GSM ranges.

### Pricing

```
base     = fabricRate × consumption
subtotal = base + processCost + (brandingRate × positions)
unit     = subtotal × (1 + margin) × quantitySlabMultiplier
shown    = unit ±10%      → always a range, never a single figure
```

Slabs: 10–49 · 50–99 · 100–299 · 300–999 · 1000+

⚠️ **Every number in `pricing.json` is invented.** While `configured: false`
the estimate is withheld entirely and replaced with *"we quote per job"* — a
buyer does not read the small print under a number. Set real rates, flip the
flag, and the estimate returns on its own.

---

## 6 · Features

### For the buyer
- **Short enquiry form** — 4 fields. Fabric, colour and sizes are things you
  work out together, not a barrier at first contact.
- **Detailed builder** one click away — multi-product basket, 7-size matrix,
  colour picker, branding placement, live SVG garment preview
- **Size-curve presets** — largest-remainder allocation, so parts always sum
  to exactly the total
- **Artwork upload** — counts distinct colours and recommends a print method
- **Sample requests** — for orders of 75+
- **Passwordless portal** — own orders, production stage, one-click reorder
- **Track by reference** + phone last 4
- **⌘K command palette** over 153 documents

### For the owner
`/admin` — **Overview · Inbox · Pipeline · Catalog · Media**
- KPIs, 14-day sparkline, conversion funnel with drop-off, lead-quality donut,
  size-demand histogram — all hand-built SVG
- **Needs-attention triage**: anything `new` for 2+ days, or high-value and
  unactioned
- 8-state pipeline with notes and a full audit timeline
- Lead scoring, search, filter, CSV export
- **Marketing attribution** — which ad produced which enquiry, ranked by
  *pieces*, not clicks. First-touch is kept alongside last-touch, because a
  buyer who finds you on a search ad and returns directly a week later would
  otherwise be credited to "direct".
- Catalog CMS with media library, drag-drop, publish/unpublish with full SEO
  cleanup, per-field revert, change log

### SEO / AEO
17 structured-data types. Per-route metadata, canonicals, OG/Twitter, auto
sitemap, robots with `/admin` and `/api/` disallowed.

**AEO** — each guide opens with an explicit question and a self-contained
2–3 sentence answer, which is the unit an answer engine lifts. `llms.txt`
states what the business is **and what it does not claim**, so a model has
nothing to hallucinate from. GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot
and Google-Extended are explicitly admitted to content.

### Resilience — nine system states
Loading (7 route-specific skeletons) · Empty · 404 · 500 with `reset()` ·
Global error (zero imports, since any import could be the crash) ·
**503 maintenance with `Retry-After`** · Offline · 429 · 403.

Maintenance returns 503, not 200 — a maintenance page returning 200 tells
Google the page *is* "we're offline". `/admin` stays reachable so you cannot
lock yourself out. Preview all nine at `/system`, primitives at `/ui`.

---

## 7 · Security

Four real vulnerabilities were found by audit and closed. Each was
demonstrated working first.

| | Issue | Fix |
|---|---|---|
| 🔴 | **Order-book enumeration** — sequential refs exposed every customer's status, volumes and size breakdowns | Second factor (phone last 4); identical body **and** timing for unknown ref vs wrong PIN |
| 🔴 | **Stored XSS** — admin-editable titles → JSON-LD via `dangerouslySetInnerHTML`; `JSON.stringify` does not escape `<` | Escape `<`, `>`, `&`, U+2028/29 |
| 🔴 | **Published default password** shipped as a live fallback | Throws on production login with demo credentials |
| 🟡 | **Customer-list enumeration** via portal response timing | Identical body + 400ms floor |

Also: CSP, HSTS, nosniff, Referrer-Policy, COOP, Permissions-Policy;
`x-powered-by` removed; `no-store` on all API responses; cross-origin POST
rejected; prepared statements throughout (SQLi probes verified harmless);
honeypot field; uploads decoded by sharp before writing and re-encoded to
strip EXIF/GPS.

---

## 8 · Configuration

```bash
# Auth — required in production
ADMIN_PASSWORD=          # min 12 chars
ADMIN_SALT=
CA_ALLOW_DEMO_AUTH=1     # demo only, bypasses the credential guard

# Notifications — set at least ONE or nothing reaches you
OWNER_WHATSAPP=          # 919876543210
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
OWNER_EMAIL=
RESEND_API_KEY=
NOTIFY_FROM=
N8N_WEBHOOK_URL=
WEBHOOK_SECRET=          # HMAC signing key

# Marketing — nothing loads unless set
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_CLARITY_ID=

# Ops
NEXT_PUBLIC_SITE_URL=
ALLOWED_ORIGINS=
MAINTENANCE_MODE=1
MAINTENANCE_ALLOW_IPS=
```

---

## 9 · Project layout

```
content/          9 JSON files — the seed CMS
data/             SQLite database
public/
  brand/          logo badge, favicon, apple-touch-icon
  categories/     8 category heroes + subcategory images
  banners/        wide section banners
  artwork/        buyer uploads
scripts/seed.mjs  demo data
src/
  app/            23 pages · 10 API routes · 7 loading skeletons
  components/     44 components, incl. kit/ (14 UI primitives)
  lib/            17 modules — api, db, auth, portal, catalog,
                  pricing, notify, marketing, schema, glossary…
start.sh          one-command recovery
```

Other docs: `API.md` · `CATALOG-CMS.md` · `FEATURES.md` · `PENDING.md` ·
`SUBCATEGORY-ART-TODO.md` · `public/brand/README.md`

---

## 10 · Before launch

**Blocking — only you can supply these**

1. **WhatsApp number** — currently `910000000000`. Every WhatsApp CTA is dead.
2. Phone, email, address, working hours
3. **Real rates in `pricing.json`**, then `configured: true`
4. Lead times and payment terms (2 blank FAQs)
5. GSM ranges per construction (7 blanks)
6. `ADMIN_PASSWORD` + `ADMIN_SALT`

**Content**
- 42 of 51 subcategories share a fallback image — see `SUBCATEGORY-ART-TODO.md`
- 6 real photographs for `/work`. **These must be real.** It is the one place
  AI would be dishonest, and buyers notice.

**Technical**
- CSP still allows `'unsafe-inline'` (Next's bootstrap needs it) — nonce-based
  CSP via middleware would close it
- Rate limiter is in-process; swap the `Map` for Redis behind several instances
- `public/uploads` and `public/artwork` are local disk — will not persist on
  Vercel; two `fs` calls to swap for S3/R2
- Admin is one shared password, so the audit log records "admin", not a person
- Clear demo data: `rm data/customapparel.db*`
