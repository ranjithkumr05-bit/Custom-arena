# API reference & security model

9 endpoints. Every one goes through a single wrapper, `route()` in
`src/lib/api.ts`, which applies the same five controls in the same order:

```
1. Origin check      on POST/PUT/PATCH/DELETE   → CSRF defence in depth
2. Rate limit        per IP, per bucket          → abuse / brute force
3. Authentication    public | admin | buyer      → access control
4. Zod validation    body or query               → no unvalidated input
5. Error envelope    catch-all                   → no stack traces escape
```

A new endpoint cannot ship without them — there is no second path to writing
a handler. Handlers receive validated data and express business logic only.

Uniform response shape:

```jsonc
{ "ok": true,  ...data }
{ "ok": false, "error": "Human readable", "errors": { "field": "why" } }
```

---

## Endpoints

| Method | Path | Auth | Rate limit | Purpose |
|---|---|---|---|---|
| POST | `/api/rfq` | public | 30/10min + 5 accepted/10min | Submit an enquiry |
| GET | `/api/rfq` | **admin** | — | List all enquiries |
| GET | `/api/track` | public | 10/min | Track one order (**ref + phone last 4**) |
| GET | `/api/search` | public | — | Search index |
| POST | `/api/portal` | public | 12/15min | Request or verify a sign-in code |
| GET | `/api/portal` | **buyer** | 90/min | Own orders, or one order via `?ref=` |
| DELETE | `/api/portal` | — | — | Sign out |
| POST | `/api/admin/auth` | public | 8/15min | Admin login |
| DELETE | `/api/admin/auth` | — | — | Admin logout |
| POST | `/api/admin/status` | **admin** | 120/min | Move an RFQ, write audit event |
| GET | `/api/admin/export` | **admin** | — | CSV export |
| GET/POST/DELETE | `/api/admin/media` | **admin** | — | Media library |
| GET/POST/DELETE | `/api/admin/catalog` | **admin** | — | Catalog CMS + revalidation |

---

## Vulnerabilities found and fixed

These were real, present in the running build, and demonstrated before fixing.

### 1. Order-book enumeration — critical

References are sequential (`CA-2609-0001`, `0002`, …). `/api/track` accepted
the reference alone, so walking the numbers returned **every customer's
status, quantities, product mix and full size breakdown**. Demonstrated
against six live records.

**Fixed.** The caller must also supply the **last 4 digits of the phone
number on the order** — never published, the same pattern couriers use. An
unknown reference and a wrong PIN return a byte-identical body, and both are
padded to a timing floor so response time cannot distinguish them either.
Rate limited to 10/min.

### 2. Stored XSS via the catalog CMS — critical

`JSON.stringify` does not escape `<`. Category titles became admin-editable
when the CMS shipped, and those titles are rendered into JSON-LD through
`dangerouslySetInnerHTML`. A title of `</script><script>…` closed the block
and executed.

**Fixed.** `safeJsonLd()` escapes `<`, `>`, `&`, U+2028 and U+2029 to their
`\uXXXX` forms — still valid JSON, breakout impossible. Verified with a live
payload.

### 3. Published default credentials — high

`ADMIN_PASSWORD` fell back to `tiruppur2026`, which is printed in the README.
Deploy without the env var and admin is effectively open.

**Fixed.** `assertSecureConfig()` throws on any production login attempt
using the demo password or salt, or a password under 12 characters. Checked
at request time, not module load, so `next build` still works without
secrets. Override with `CA_ALLOW_DEMO_AUTH=1` for demos.

### 4. No security headers — medium

**Fixed.** CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Cross-Origin-Opener-Policy`. `x-powered-by` removed.
All `/api/*` responses are `no-store` so no authenticated body lands in a
shared cache. `/admin` and `/my-orders` are `noindex`.

### 5. Customer-list enumeration on the portal — medium

Requesting a sign-in code took a different code path for known and unknown
numbers, so response timing revealed which numbers were customers.

**Fixed.** Identical body plus a 400 ms timing floor on both paths.

### 6. Unvalidated catalog slugs — low

Slugs went into override keys unchecked.

**Fixed.** `^[a-z0-9-]+$`, max 64 chars, and the target must exist in the live
catalog. Max 12 fields per patch. Path traversal returns `Invalid slug`.

---

## Controls already in place

**SQL injection** — every query is a prepared statement with bound
parameters. `'; DROP TABLE rfqs;--` and UNION probes all returned the normal
"not found" response with tables intact.

**Authorisation** — `/api/portal` is scoped to the signed-in phone number.
Fetching another buyer's reference returns 404, not 403, so it does not
confirm the reference exists.

**Passwords** — scrypt with `timingSafeEqual`. Sessions are server-side rows,
not signed tokens, so revocation is immediate. Cookies are `httpOnly`,
`sameSite=lax`, `secure` in production.

**Sign-in codes** — 6 digits, SHA-256 hashed at rest, single-use, 10-minute
expiry, max 5 attempts, previous codes invalidated on reissue.

**Uploads** — decoded with sharp before anything is written (a file claiming
`image/jpeg` that will not decode is rejected), re-encoded to WebP which
strips EXIF including GPS, 12 MB cap, randomised filenames, MIME allowlist.

**Honeypot** — hidden `website` field on the quote form.

---

## Known limitations

| | |
|---|---|
| CSP allows `'unsafe-inline'` for scripts | Required by Next's inline bootstrap. Removing it needs nonce-based CSP via middleware. JSON-LD is escaped at source, so the residual risk is the framework's own runtime. |
| Rate limiter is in-process | Correct for one instance. Behind several, or serverless, swap the `Map` in `ratelimit.ts` for Redis — the signature is unchanged. |
| `public/uploads` is a local disk write | Does not persist on Vercel. Swap two `fs` calls for S3/R2. |
| No CAPTCHA on the quote form | Honeypot plus rate limiting only. Add Turnstile if spam appears. |
| Admin is a single shared password | No per-user accounts, so the audit log records "admin" rather than a person. Fine for a family unit; add real users before the team grows. |

---

## Environment

```bash
ADMIN_PASSWORD=        # required in production, min 12 chars
ADMIN_SALT=            # required in production
N8N_WEBHOOK_URL=       # automation endpoint
WEBHOOK_SECRET=        # HMAC-SHA256 signing key for outbound webhooks
ALLOWED_ORIGINS=       # extra origins for the CSRF check, comma separated
NEXT_PUBLIC_SITE_URL=
CA_ALLOW_DEMO_AUTH=1   # demo only — bypasses the credential guard
```
