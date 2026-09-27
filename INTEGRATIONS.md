# CMS · CRM · n8n — how they are wired

Three systems, one database. This is how each is configured, and how a single
enquiry moves through all of them.

---

## The whole flow, end to end

```
   BUYER                        YOUR SITE                      YOU
   ─────                        ─────────                      ───

   opens a category  ────────►  CMS renders it
                                (seed JSON + your admin edits)

   fills the form    ────────►  POST /api/rfq
                                   │
                                   ├─ Zod validates
                                   ├─ rate limit
                                   ├─ CRM writes rfqs + rfq_lines
                                   │        + rfq_events  (atomic)
                                   ├─ claims uploaded artwork
                                   ├─ scores the lead
                                   │
                                   ├──────► WhatsApp  ─────►  your phone
                                   ├──────► Email     ─────►  your inbox
                                   └──────► n8n       ─────►  Sheet, CRM,
                                                              acknowledgement
                                   │
   gets CA-2609-0042 ◄─────────────┘

                                /admin Inbox  ◄──────────────  you open it
                                   │
   "your rate is ready" ◄───── status → quoted ──► n8n ──► buyer notified
   (via n8n)                        │
                                    ▼
                                rfq_events — who changed what, when
```

Everything below is one of those three boxes.

---

# 1 · CMS

## What it is

A two-layer system. `content/*.json` is the **seed**; admin edits are stored
separately and merged over the top at read time.

```
content/categories.json      seed — version controlled, never written to
          │
          ▼  merge
catalog_overrides (SQLite)   your edits, as sparse patches
          │
          ▼
   what the site renders
```

**Why not edit the JSON directly**, the way Strapi-style tools do:

1. A writable file in the repo means every content edit conflicts with every
   code change
2. A bad save overwrites the original with no way back
3. No record of who changed what

With an overlay, deleting one row restores the seed *exactly* — verified by
checksum — and every field change is logged.

## Files you can edit by hand

| File | Controls |
|---|---|
| `site.json` | Name, contact, address, MOQ, capability flags |
| `categories.json` | 8 categories → 51 subcategories |
| `pricing.json` | Every calculator rate |
| `fabrics.json` | Fabric table, GSM ranges |
| `decoration.json` | The 5 branding methods |
| `process.json` | The 6 production stages |
| `faqs.json` · `guides.json` | FAQ and long-form content |
| `styles.json` | Neck, sleeve, fit options |

Editing these needs a rebuild (`npm run build`) unless you are on `npm run dev`.

## Editing from the admin instead

**`/admin` → Catalog**

| | Category | Subcategory |
|---|---|---|
| Photo | ✅ hero | ✅ card + detail |
| Title · summary · blurb | ✅ | ✅ |
| Show / hide | ✅ | ✅ |
| Revert to original | ✅ | ✅ |

No rebuild needed. On save the API calls `revalidatePath()` on exactly the
affected routes plus `/`, `/what-we-make` and `/sitemap.xml`, so you keep
static-page speed with instant edits.

**Hiding** removes the page, its sitemap entry and its search-index entry
together. Showing puts all three back.

## The `confirm` flag

```jsonc
"phone": { "value": "", "confirm": true }
```

Renders an amber marker **and excludes the value from structured data**. This
is what stops an unverified capacity figure leaking into schema.org. Fill the
value, set `confirm: false`, and it publishes.

## Media

`/admin` → Media. Every upload is:

- decoded by sharp **before** anything touches disk — a file claiming to be a
  PNG that will not decode is rejected
- re-encoded to WebP (a 281 KB JPEG tested at 11 KB)
- capped at 2000px
- **EXIF stripped** — phone photos carry GPS coordinates
- given a random filename

Files land in `public/uploads/`. Not persistent on Vercel — swap the two `fs`
calls in `src/app/api/admin/media/route.ts` for S3 or R2 first.

## Safety rails

Only whitelisted fields can be patched (`ALLOWED_CAT` / `ALLOWED_SUB` in
`src/lib/catalog.ts`). Slugs must match `^[a-z0-9-]+$` **and** exist in the
live catalog, so a crafted request cannot create an orphan override. Saving an
empty value deletes that field from the patch — which is how per-field revert
works.

---

# 2 · CRM

## Tables

```
rfqs ──┬── rfq_lines    one enquiry, up to 12 products, each with a size matrix
       ├── rfq_events   immutable audit trail
       └── rfq_files    artwork, claimed by a one-time token
```

`createRfq` is a **transaction** — header, every line and the opening audit
event commit together or not at all.

## The pipeline

```
new → contacted → quoted → sampling → in_production → dispatched → closed
                                                                 ↘ lost
```

Every move writes an `rfq_events` row: actor, from-status, to-status, note,
timestamp. Nothing is editable after the fact.

Production stage is mapped by **slug**, not index:

```ts
in_production → "branding"
dispatched    → "packing-dispatch"
```

It used to be hardcoded indices. When the process went from 8 stages to 6,
every number silently pointed at the wrong stage. Slugs survive reordering
and warn loudly if a stage is deleted.

## Lead scoring

Runs automatically on submission, out of 110:

| Signal | Points |
|---|---|
| 500+ pieces | 40 |
| 100–499 | 25 |
| 50–99 | 15 |
| under 50 | 5 |
| Has an organisation name | 15 |
| Gave an email | 10 |
| Gave a deadline | 15 |
| Corporate, school or brand buyer | 15 |

**60+ = high · 35–59 = medium · below = low**

High-priority leads trigger the WhatsApp alert and surface in the
needs-attention panel.

## The admin

**Overview · Inbox · Pipeline · Catalog · Media**

- KPIs, 14-day sparkline, conversion funnel with drop-off, lead-quality donut,
  size-demand histogram — all hand-built SVG, no charting library
- **Needs attention**: anything sitting in `new` for 2+ days, or high-value
  and unactioned
- Kanban pipeline, search, filter by status
- CSV export with a UTF-8 BOM so Excel opens it correctly

## Buyer-side CRM

**`/my-orders`** — no registration. The account exists the moment someone
submits an enquiry, keyed to their phone number. A 6-digit code proves
ownership: SHA-256 at rest, single-use, 10-minute expiry, 5 attempts.

Phone numbers normalise to the last 10 digits, so `+91 98765 43210` and
`09876543210` are the same buyer.

**Reorder** pulls a previous order's full line items and size breakdown back
into the quote builder. For schools and corporates reordering annually, this
is the highest-value feature in the portal.

## Attribution

Every RFQ carries where it came from: `utm_source`, `utm_medium`,
`utm_campaign`, `utm_term`, `click_id`, `landing_page`, `device`, `touches`.

The dashboard ranks sources by **pieces enquired, not clicks** — a source
sending 10 visitors who ask for 4,000 pieces beats one sending 400 who ask for
none, and click-based analytics tells you the opposite.

**First touch is kept alongside last touch.** A buyer finds you on a search
ad, leaves, returns directly a week later to enquire. Last-touch alone credits
that to "direct" and you switch off the ad that earned it.

---

# 3 · n8n

## Configuration

```bash
N8N_WEBHOOK_URL=https://your-n8n.example.com/webhook/custom-apparel-rfq
WEBHOOK_SECRET=any-long-random-string
```

That is the whole setup. With `N8N_WEBHOOK_URL` unset, dispatch returns
`{sent:false}` and the site logs a warning — enquiries are still saved.

## Events sent

| Event | When |
|---|---|
| `rfq.created` | A buyer submits an enquiry |
| `sample.requested` | Same, but the sample path |
| `rfq.status_changed` | You move an RFQ to quoted, in_production or dispatched |
| `buyer.code` | A buyer requests a portal sign-in code |

## Payload

```jsonc
POST  →  $N8N_WEBHOOK_URL

Headers
  Content-Type:    application/json
  X-CA-Event:      rfq.created
  X-CA-Signature:  sha256=<hmac of the raw body using WEBHOOK_SECRET>

Body
{
  "event":  "rfq.created",
  "sentAt": "2026-09-27T09:14:22.118Z",
  "data": {
    "ref": "CA-2609-0042",
    "status": "new",
    "priority": "high",
    "score": 80,
    "name": "Priya Raman",
    "organisation": "Sunrise Matriculation School",
    "phone": "+91 98765 43210",
    "email": "priya@example.com",
    "city": "Coimbatore",
    "qty": 256,
    "required_by": "2026-11-15",
    "notes": "…",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "corporate-polo-tn",
    "lines": [
      { "product": "tee", "fabric": "single-jersey", "decoration": "screen",
        "positions": 2, "colour": "Red", "qty": 220,
        "sizes": { "XS": 20, "S": 60, "M": 70, "L": 50, "XL": 20 } }
    ],
    "events": [ … ],
    "files":  [ { "url": "/artwork/…webp", "original_name": "logo.png" } ]
  }
}
```

**Verify the signature** in your first n8n node. Without it, anyone who
discovers the webhook URL can post fake enquiries:

```js
const crypto = require('crypto');
const expected = 'sha256=' + crypto
  .createHmac('sha256', $env.WEBHOOK_SECRET)
  .update(JSON.stringify($json.body))
  .digest('hex');
if ($headers['x-ca-signature'] !== expected) throw new Error('Bad signature');
```

## Delivery behaviour

- **Fire and forget** — never blocks the buyer's submission
- 5 second timeout
- Exponential backoff, 2 retries
- Gives up on non-retryable 4xx, keeps trying on 5xx and 429

## The supplied workflow

Import `n8n/rfq-workflow.json`:

```
RFQ received (webhook)
      ▼
Score and format (code)        sizes → readable, builds a wa.me link
      ▼
High priority? (if)
      ├── yes ──► WhatsApp alert to owner (HTTP → Meta Cloud API)
      │                 ▼
      └── no ─────► Append to CRM sheet (Google Sheets)
                          ▼
                    Acknowledge buyer (Gmail)
                          ▼
                    Respond (webhook reply)
```

Replace `YOUR_PHONE_NUMBER_ID`, `YOUR_OWN_NUMBER` and `YOUR_SHEET_ID` before
activating.

## Setting it up

1. Create a workflow in n8n, add a **Webhook** node, path `custom-apparel-rfq`
2. Copy the **production** URL — not the test URL, which only listens while
   the editor is open
3. Put it in `.env.local` as `N8N_WEBHOOK_URL`
4. Set `WEBHOOK_SECRET` to the same value in both places
5. Restart the site
6. Submit a test enquiry and watch it arrive

---

## Notifications — n8n is one of three

n8n is optional. Two direct channels exist alongside it, and all three fire
**in parallel** so a slow one never delays the others:

| Channel | Transport | Needs |
|---|---|---|
| WhatsApp | Meta Cloud API | `OWNER_WHATSAPP`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` |
| Email | Resend | `OWNER_EMAIL`, `RESEND_API_KEY`, `NOTIFY_FROM` |
| Automation | n8n | `N8N_WEBHOOK_URL` |

All plain `fetch` — no SMTP library, no SDK.

**Configure at least one.** With none set, the enquiry is saved and visible in
`/admin`, but nothing reaches you. The server logs:

```
[notify] CA-2609-0042 (256 pcs, high) — NO CHANNEL CONFIGURED.
```

That failure mode is how enquiries get lost, so it is deliberately loud.

---

## Where each thing lives

| Concern | File |
|---|---|
| CMS merge, patches, media records | `src/lib/catalog.ts` |
| CMS API + revalidation | `src/app/api/admin/catalog/route.ts` |
| Media upload | `src/app/api/admin/media/route.ts` |
| CRM schema, transactions, scoring | `src/lib/db.ts` |
| Statuses, stage mapping | `src/lib/rfq.ts` |
| Dashboard metrics | `src/lib/analytics.ts` |
| Notification fan-out | `src/lib/notify.ts` |
| Signed webhook dispatch | `src/lib/webhook.ts` |
| Buyer portal auth | `src/lib/portal.ts` |
| Attribution capture | `src/lib/marketing.ts` |
| n8n workflow | `n8n/rfq-workflow.json` |
