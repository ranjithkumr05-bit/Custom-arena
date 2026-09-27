# What's pending

Audited from the live codebase. Grouped by who can actually do it.

---

## 🔴 Blocks launch — only you can supply these

These are real-world facts. I will not invent them, so they stay marked
`confirm` and are excluded from structured data until you fill them in.

### 14 fields in `content/site.json`

| Field | State |
|---|---|
| `contact.whatsapp` | **placeholder `910000000000`** — every WhatsApp button is dead until this changes |
| `contact.phone` · `contact.email` · `contact.hours` | empty |
| `location.addressLine` · `location.pincode` | empty |
| `legalName` | empty |
| `business.yearsTrading` · `dailyCapacity` · `teamSize` · `gstRegistered` | empty |
| `business.sampleLeadDays` · `bulkLeadDays` · `paymentTerms` | empty |

**The WhatsApp number is the single highest-priority item on this page.** It
appears on the floating button, the mobile action bar, every category CTA and
inside the quote builder's pre-filled message. All of them currently point
nowhere.

### 2 blank FAQ answers
`content/faqs.json` — "What are your lead times?" and "What are your payment
terms?" render as *"To be filled in with your confirmed information."*

### 7 blank GSM ranges
`content/fabrics.json` — your actual working range per construction
(single jersey, pique, interlock, rib, fleece, loop knit, performance poly).

### All pricing is invented
`content/pricing.json` → `"configured": false`

6 fabric rates · 5 product process costs · 6 branding rates · 5 quantity
slabs · 18% margin. **The formula is production-ready; the numbers are not.**
Stated openly on `/pricing`.

> Real rates for **one product** would be enough to prove the calculator.
> That is the highest-value thing you can send me.

---

## 🟡 Content — I can do these, you decide priority

### 42 of 51 subcategory images share a fallback

| Category | Pending |
|---|---|
| School & College T-Shirts | 7 |
| Retail & Store Apparel | 7 |
| Private Label & Custom Mfg | 7 |
| Hoodies & Sweatshirts | 6 |
| Group & Event T-Shirts | 6 |
| Workwear & Staff Apparel | 5 |
| Corporate & Office Apparel | 4 |

They look correct today — real on-palette photos, not grey boxes. Bespoke art
converts better. I can generate ~10 per turn, or you replace any of them
yourself in **`/admin` → Catalog**.

### 6 real-photo slots on `/work`
Cutting · stitching floor · branding · quality check · finishing · your people.

**These must be real photographs.** No AI factory images — that is the one
place it would be dishonest, and buyers spot it. Shooting guide is on the page.

---

## 🟢 Technical — safe to defer, but know they exist

| | Issue | When it matters |
|---|---|---|
| CSP allows `'unsafe-inline'` | Required by Next's bootstrap. Needs nonce-based CSP via middleware. | Before handling real customer data |
| Rate limiter is in-process | Correct on one instance. Swap the `Map` for Redis. | Only if you scale past one server |
| `public/uploads` is local disk | Will not persist on Vercel. Two `fs` calls to swap for S3/R2. | Only if you deploy serverless |
| Admin is one shared password | Audit log records "admin", not a person. | When more than one person uses it |
| `ADMIN_PASSWORD` / `ADMIN_SALT` unset | Login throws in production by design. | At deploy |
| No CAPTCHA | Honeypot + rate limiting only. | Only if spam appears |

---

## 🔵 Housekeeping

**11 test RFQs in the database** — 9 seeded demo enquiries plus 2 I created to
prove marketing attribution (`CA-2609-0010` Google Ads, `CA-2609-0011`
Instagram).

They make the dashboard, funnel and traffic-source charts look real. Clear
them before launch with:

```bash
rm data/customapparel.db*   # then restart
```

---

## Suggested order

1. **WhatsApp number** — unblocks every CTA on the site
2. **Phone, email, address** — unblocks the footer and contact page
3. **Real rates for one product** — turns the calculator from demo to tool
4. **Shoot the 6 `/work` photos** — a phone in daylight beats stock
5. Lead times and payment terms — closes the two open FAQs
6. GSM ranges — completes the fabrics table
7. The 42 subcategory images — I generate, or you upload
8. `ADMIN_PASSWORD` + `ADMIN_SALT`, then clear the test data
