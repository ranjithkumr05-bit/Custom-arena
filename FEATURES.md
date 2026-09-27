# What's been built

**84 routes · 12,397 lines · 23 pages · 9 API routes · 36 components · 15 lib modules**

Runtime dependencies: `next`, `react`, `react-dom`, `better-sqlite3`, `sharp`, `zod`.
That's it — no UI library, no charting library, no ORM, no auth library, no
animation library. Each of those was a deliberate call, noted below.

---

## 1 · Frontend

| Feature | Why it's not trivial |
|---|---|
| **Live SVG garment visualiser** | Tee / polo / hoodie / jersey drawn as vector paths. Colour, branding placement and method render live. Seam and print-zone contrast is **computed from garment luminance**, so it stays legible on white and navy. Sublimation renders as a full panel print because that's what it physically is; embroidery renders as stitch lines. |
| **14 hand-built UI primitives** | Menu, Dialog, Sheet, Tooltip, Tabs, Accordion, Segmented, Switch, Stepper, Avatar, Badge, Spinner, Toast, Portal. ~9 KB vs ~60 KB for Radix + Headless UI + Framer Motion. |
| **Focus restoration** | Dialogs trap focus *and* return it to the trigger. Skipping this strands keyboard users at the top of the document. |
| **Roving tabindex** | Menus and tabs are **one** tab stop with arrow-key navigation, plus menu typeahead. |
| **Measured animations** | Accordion height and the tab/segment indicators animate from measured values via `ResizeObserver`, not magic `max-height`. Correct at any content length or label width. |
| **Anchored overlays** | Flip-above and shift-into-view positioning — a small slice of Floating UI, no dependency. |
| **⌘K command palette** | 153-document index, subsequence fuzzy scoring weighted for early/contiguous matches. |
| **Multi-product quote builder** | One enquiry, up to 12 styles, each with its own fabric, colour, branding and 7-size matrix. |
| **Size-curve presets** | Six distributions using **largest-remainder allocation**, so parts always sum to exactly the total — no rounding drift. |
| **Hierarchical back bar** | Deliberately *not* `router.back()`. A button labelled "Back to Sportswear" that lands elsewhere is worse than none. |
| **Scroll reveal** | `IntersectionObserver`, unobserves after first reveal, no-op under reduced motion. |
| **Mobile action bar** | Reveals after the hero, hides on `/quote`, padded with `env(safe-area-inset-bottom)`. |

---

## 2 · Backend

| Feature | Detail |
|---|---|
| **SQLite, 9 tables, 8 indexes** | WAL mode, foreign keys, cascade deletes, idempotent migrations on import. |
| **Transactional writes** | `createRfq` commits header + all line items + the opening audit event atomically, or not at all. |
| **Immutable audit trail** | Every RFQ status change and every catalog field edit records actor, field, old value, new value, timestamp. |
| **Unified API layer** | One `route()` wrapper applies origin check → rate limit → auth → Zod → error envelope, in that order, to all 9 endpoints. A new endpoint *can't* ship without them. |
| **Schema-derived validation** | Zod enums are generated **from the pricing config**, so an invalid product key is impossible by construction. |
| **Two-tier rate limiting** | A loose ceiling on traffic, a strict one on *accepted* submissions — a buyer fixing a typo is never locked out. |
| **Signed webhooks** | HMAC-SHA256, exponential-backoff retry, 5s timeout, gives up on non-retryable 4xx. Never blocks the buyer. |
| **Image pipeline** | Decoded with sharp before writing, re-encoded to WebP (tested: 281 KB → 11 KB), capped at 2000px, EXIF stripped, 20px inline placeholder generated. |
| **Catalog overlay CMS** | Seed JSON stays read-only; admin edits are sparse patches in SQLite. Deleting a row restores the original exactly — verified by checksum. |
| **ISR revalidation on edit** | Static page speed *with* instant content updates. |
| **Passwordless buyer portal** | 6-digit code, SHA-256 at rest, single-use, 10-min expiry, 5 attempts, previous codes invalidated on reissue. |
| **Phone normalisation** | `9876543210`, `+919876543210`, `+91 98765 43210`, `098765-43210` all resolve to one buyer. |
| **Reorder from spec** | Pulls a previous order's full line items and size breakdown back into the builder. |
| **CSV export** | UTF-8 BOM for Excel, RFC-compliant escaping, flattened line items. |

---

## 3 · Content, SEO & AEO

- **8 categories → 51 subcategory pages**, each with its own page, image, schema and quote deep-link
- **57-term glossary**, 5 long-form guides, 10 FAQs, 7 fabrics, 5 branding methods, 8 process stages
- **17 structured-data types**: Organization, Service, Product, Article, FAQPage, HowTo, HowToStep, BreadcrumbList, ItemList, ListItem, **DefinedTermSet**, DefinedTerm, CollectionPage, Brand, PostalAddress, Country, Question/Answer
- **AEO**: every guide opens with an explicit question and a self-contained 2–3 sentence answer — the unit an answer engine actually lifts. `llms.txt` states what the business is **and what it does not claim**, so a model has nothing to hallucinate from. `robots.ts` explicitly admits GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended.
- **Pricing transparency page** publishing the real costing formula and slab table
- **Brand system**: knit-stitch mark (the actual structure of single jersey), 5 vector lockups, favicon tested at 16/32/96px, `/brand` kit page

### The honesty layer
A `confirm` flag marks any unverified value. It renders an amber chip **and
excludes the value from structured data**. Currently flagged: years trading,
capacity, team size, GST, lead times, payment terms, phone, email, address,
GSM ranges. No certifications, client names or delivery guarantees appear
anywhere.

---

## 4 · Security

Four real vulnerabilities were found by audit and fixed — each was
demonstrated working before being closed.

| | Issue | Fix |
|---|---|---|
| 🔴 | **Order-book enumeration.** Sequential refs let anyone walk every customer's status, volumes and size breakdowns | Second factor (phone last 4), identical response + timing floor for unknown ref vs wrong PIN |
| 🔴 | **Stored XSS.** Admin-editable titles → JSON-LD via `dangerouslySetInnerHTML`; `JSON.stringify` doesn't escape `<` | Escape `<`, `>`, `&`, U+2028/29 to `\uXXXX` |
| 🔴 | **Published default password** in the README, shipped as a live fallback | Throws on any production login using demo credentials |
| 🟡 | **Customer-list enumeration** via portal response timing | Identical body + 400 ms floor on both paths |

Also in place: CSP / HSTS / nosniff / Referrer-Policy / COOP / Permissions-Policy,
`x-powered-by` removed, `no-store` on all API responses, cross-origin POST
rejection, scrypt + `timingSafeEqual`, server-side revocable sessions,
prepared statements throughout (SQLi probes verified harmless), honeypot field.

---

## 5 · Resilience — the nine system states

Loading (7 route-specific skeletons) · Empty · 404 · 500 with `reset()` ·
Global error (zero imports, since any import could be the crash) ·
**503 maintenance with `Retry-After`** · Offline · 429 · 403.

Maintenance returns **503, not 200** — a maintenance page returning 200 tells
Google the page *is* "we're offline" and it indexes that. `/admin` stays
reachable so you can't lock yourself out during an outage.

Preview all nine at `/system`. Preview every primitive at `/ui`.

---

## 6 · Admin

Five tabs: **Overview · Inbox · Pipeline · Catalog · Media**

- Dashboard: KPIs, 14-day sparkline, conversion funnel with drop-off %, lead-quality donut, size-demand histogram, 4 bar lists — **all hand-built SVG** (~4 KB vs ~90 KB for a charting library)
- **Needs-attention triage**: surfaces anything sitting in `new` 2+ days, or high-value and unactioned
- Kanban pipeline, lead scoring, search/filter, CSV export
- Catalog CMS with media library, drag-drop, clipboard paste, publish/unpublish with full SEO cleanup, per-field revert, change log

---

## Still outstanding

| | |
|---|---|
| **42 of 51 subcategory images** share a fallback | Tracked in `SUBCATEGORY-ART-TODO.md`. They look correct today — real on-palette photos, not grey boxes. |
| **All pricing is placeholder** | Formula is production-ready; the numbers are invented. Stated on `/pricing` itself. |
| **CSP allows `'unsafe-inline'`** | Required by Next's bootstrap. Needs nonce-based CSP via middleware. |
| **Rate limiter is in-process** | Correct for one instance. Swap the `Map` for Redis behind several. |
| **`public/uploads` is local disk** | Won't persist on Vercel. Two `fs` calls to swap for S3/R2. |
| **Admin is one shared password** | Audit log records "admin", not a person. Fine for a family unit. |
| **Real photography for `/work`** | Six marked slots. No AI factory images — deliberately. |
