# What's left before production

Audited from the live files. Grouped by who can actually do it.

---

## 🔴 Blocking — only you can supply these

### 14 business facts in `content/site.json`

Nothing here is invented. Each renders an amber marker and is **excluded from
structured data** until you set `confirm: false`.

| Field | State | Why it matters |
|---|---|---|
| `contact.whatsapp` | **`910000000000`** | **Every WhatsApp button on the site is dead** |
| `contact.phone` | empty | Footer, contact page, mobile call button |
| `contact.email` | empty | Footer, contact page |
| `contact.hours` | empty | Contact page |
| `location.addressLine` | empty | Footer, contact, LocalBusiness schema |
| `location.pincode` | empty | Local SEO |
| `legalName` | empty | Invoices, Organization schema |
| `business.yearsTrading` | empty | About page |
| `business.dailyCapacity` | empty | About page |
| `business.teamSize` | empty | About page |
| `business.gstRegistered` | empty | Buyer trust signal |
| `business.sampleLeadDays` | empty | Feeds the sample FAQ |
| `business.bulkLeadDays` | empty | Feeds the lead-time FAQ |
| `business.paymentTerms` | empty | Feeds the payment FAQ |

**The WhatsApp number is the single highest-priority item in this document.**
It appears on the floating button, the mobile action bar, every category CTA
and inside the pre-filled quote message. All of them currently point nowhere.

### Pricing is invented

`content/pricing.json` → `"configured": false`

6 fabric rates · 6 product process costs · 6 branding rates · 5 quantity slabs
· 18% margin — **all placeholders.** The formula is production-ready; the
numbers are not.

While `configured` is false the site shows *"we quote per job"* instead of a
figure. That is deliberate: a buyer does not read the small print under a
number, so showing nothing beats showing something wrong.

> Real rates for **one product** would be enough to prove the calculator end
> to end.

### 2 unanswered FAQs

`content/faqs.json` — *"What are your lead times?"* and *"What are your
payment terms?"* currently render as "to be filled in".

### 7 blank GSM ranges

`content/fabrics.json` — your actual working range per construction: single
jersey, pique, interlock, rib, fleece, loop knit, performance poly.

---

## 🟡 Content — I can do these, you decide priority

### 42 of 51 subcategory images share a fallback

| Category | Pending |
|---|---|
| School Uniform | 7 |
| Shop & Showroom | 7 |
| Your Own Brand | 7 |
| Hoodies | 6 |
| Group & Event | 6 |
| Staff & Workwear | 5 |
| Corporate & Office | 4 |

They look correct today — real on-palette photos, not grey boxes. Bespoke art
converts better. Roughly 10 per turn, or you upload your own in
`/admin → Catalog`.

### 6 real photographs for `/work`

Cutting · stitching floor · branding · quality check · finishing · your people.

**These must be real.** It is the one place AI would be dishonest, and buyers
notice — two of your competitors use Unsplash factory shots and it shows. A
phone in daylight beats all of it. Shooting guide is on the page.

---

## 🟠 Deployment — must be done before it goes public

```bash
ADMIN_PASSWORD=        # admin THROWS in production without this
ADMIN_SALT=            # same
NEXT_PUBLIC_SITE_URL=  # canonicals, sitemap, OG tags
```

Also `"url"` in `content/site.json` is still `https://example.com` — it feeds
every canonical tag and the sitemap.

**At least one notification channel**, or enquiries arrive silently:

```bash
OWNER_WHATSAPP + WHATSAPP_TOKEN + WHATSAPP_PHONE_ID
OWNER_EMAIL + RESEND_API_KEY + NOTIFY_FROM
N8N_WEBHOOK_URL + WEBHOOK_SECRET
```

If you use n8n, **verify the HMAC signature in your first node** — the site
signs every request, but nothing stops a forged one if n8n does not check.
Snippet is in `INTEGRATIONS.md`.

**Clear the demo data:** 9 seeded enquiries are in the database.
`npm run reset:db`

---

## 🟢 Technical — safe to defer, but know they exist

| Issue | When it matters |
|---|---|
| CSP still allows `'unsafe-inline'` for scripts — Next's bootstrap needs it | Before handling real customer data. Needs nonce-based CSP via middleware. |
| Rate limiter is in-process | Only if you run more than one instance |
| `public/uploads` and `public/artwork` are local disk | Will not persist on Vercel. Two `fs` calls to swap for S3/R2. |
| Admin is one shared password | Audit log records "admin", not a person. Fine until more than one of you uses it. |
| No CAPTCHA | Honeypot + rate limiting only. Add Turnstile if spam appears. |
| Logo is a raster PNG | Get the vector from whoever drew it before any print or signage |

---

## Suggested order

1. **WhatsApp number** — one line, unblocks every CTA on the site
2. Phone, email, address
3. **Real rates for one product**, then `configured: true`
4. `ADMIN_PASSWORD` + `ADMIN_SALT`, and one notification channel
5. Shoot the 6 `/work` photos
6. Lead times and payment terms → closes both FAQs
7. GSM ranges → completes the fabrics table
8. `npm run reset:db`, set the real domain, deploy
9. The 42 subcategory images — ongoing, not blocking

Steps 1–4 are roughly an hour of your time and take the site from demo to
usable.
