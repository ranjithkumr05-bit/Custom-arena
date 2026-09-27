# Running CustomWear on your own machine

Works on **Windows, macOS and Linux**. About 5 minutes the first time.

---

## 1 · Install Node.js

You need **Node 20.9 or newer**. Check what you have:

```bash
node -v
```

If it prints nothing, or a number below `v20.9`, install the **LTS** build
from [nodejs.org](https://nodejs.org). Accept every default. On Windows, tick
*"Automatically install the necessary tools"* if offered — two packages here
contain native code and need those build tools.

Close and reopen your terminal afterwards, then check again.

---

## 2 · Get the project onto your machine

Download the `capparel` folder from the workspace and unzip it somewhere
sensible — `Documents/customwear` is fine. Avoid OneDrive or Google Drive
folders; their sync can corrupt `node_modules` mid-install.

Open a terminal **inside that folder**:

- **Windows** — open the folder in File Explorer, type `cmd` in the address bar, press Enter
- **macOS** — right-click the folder → Services → *New Terminal at Folder*
- **Linux** — `cd ~/Documents/customwear`

Confirm you are in the right place. This should list `package.json`:

```bash
dir        # Windows
ls         # macOS / Linux
```

---

## 3 · Install and build

```bash
npm run setup
```

Runs `npm ci` then `next build`. **It takes 2–4 minutes and looks frozen for
long stretches.** That is normal — it unpacks roughly 550 MB.

`better-sqlite3` and `sharp` contain native code and fetch a binary matched to
your machine. The lockfile carries Windows, Intel Mac, Apple Silicon and Linux
builds, so all four work.

---

## 4 · Start it

```bash
npm start
```

Open **http://localhost:3100** · stop with `Ctrl + C`

Admin is at **/admin**, password `tiruppur2026`. If it errors instead of
loading, see Troubleshooting — that is expected behaviour, not a fault.

---

## 5 · Two ways to run

| | Command | Use when |
|---|---|---|
| **Production** | `npm start` | Showing someone, checking real speed |
| **Development** | `npm run dev` | Editing — changes appear in ~2s, no rebuild |

If you edit anything in `content/` while running `npm start`, you must
rebuild:

```bash
npm run build
npm start
```

`npm run dev` picks changes up on its own. Use that while you work.

---

## 6 · Putting in your real details

Almost everything you will want to change is in **`content/site.json`**. Open
it in Notepad, TextEdit or [VS Code](https://code.visualstudio.com).

```jsonc
"contact": {
  "whatsapp": { "value": "910000000000", "confirm": true },
  "phone":    { "value": "",             "confirm": true },
  "email":    { "value": "",             "confirm": true }
}
```

Fill in `value`, then set `confirm` to `false`:

```jsonc
"whatsapp": { "value": "919876543210", "confirm": false }
```

**`confirm: true` means "not verified yet".** The site shows an amber marker
and deliberately keeps that value out of its SEO data. Setting it to `false`
publishes it.

> WhatsApp format: country code, no `+`, no spaces. India → `91` then the
> 10 digits.

| File in `content/` | Controls |
|---|---|
| `site.json` | Name, contact, address, MOQ |
| `categories.json` | The 8 categories and 51 subcategories |
| `pricing.json` | All calculator rates — **currently invented** |
| `faqs.json` | The FAQ list |
| `fabrics.json` | Fabric table and GSM ranges |

---

## 7 · Turning the price calculator on

Every rate in `content/pricing.json` is a placeholder. While
`"configured": false` the site shows *"we quote per job"* instead of a figure —
on purpose, because a wrong price is worse than no price.

Put your real rates in, then set:

```jsonc
"configured": true
```

Rebuild, and estimates appear.

---

## 8 · Secrets

Create **`.env.local`** in the project folder. Copy `.env.example` as a start.

```bash
# Admin — set this before anyone else can reach the site
ADMIN_PASSWORD=pick-something-long-and-private
ADMIN_SALT=any-random-string-you-invent-once

# Getting told about enquiries — set at least ONE group
OWNER_WHATSAPP=919876543210
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=

OWNER_EMAIL=you@yourdomain.com
RESEND_API_KEY=
NOTIFY_FROM=enquiries@yourdomain.com
```

Restart after editing. **Never share or commit `.env.local`.**

> With no notification channel set, enquiries are still saved and visible in
> `/admin` — but nothing reaches your phone. The server prints a warning
> saying exactly that.

---

## 9 · Demo data

The download includes test enquiries so the dashboard looks alive.

```bash
npm run reset:db    # wipe them
npm start           # fresh, empty database
npm run seed        # put 8 demo enquiries back
```

Clear them before going live, or your first real enquiry will be buried in
fake ones.

---

## 10 · Troubleshooting

**`'npm' is not recognized` / `command not found`**
Node is not installed, or the terminal was open before you installed it.
Close every terminal window and open a new one.

**`EADDRINUSE: address already in use :::3100`**
Something is already on that port, usually a copy you forgot to stop.

```bash
npx kill-port 3100
```

Or use another port: `npx next start -p 3200`

**`Could not locate the bindings file` / `invalid ELF header`**
A native module was built for a different Node version:

```bash
npm rebuild better-sqlite3 sharp
```

Still failing? Delete `node_modules` and run `npm ci` again. On Windows use
File Explorer to delete it if the command line refuses.

**Admin errors instead of loading**
Expected. In production it refuses to run on the demo password, because that
password is written in these docs. Either set `ADMIN_PASSWORD` in
`.env.local`, or for local testing only:

```bash
CA_ALLOW_DEMO_AUTH=1 npm start          # macOS / Linux
$env:CA_ALLOW_DEMO_AUTH=1; npm start    # Windows PowerShell
```

**Images missing**
Check `public/categories/` survived the download. Some unzip tools skip large
files without saying so.

**`bash: start.sh: No such file` on Windows**
`start.sh` is a Linux helper. On Windows use `npm run setup` and `npm start`.

**Site loads but looks unstyled**
The build did not finish. Run `npm run build` and read the output.

---

## 11 · Putting it online

This needs a host with a **persistent disk** — the database is a file and
uploads are written into `public/`.

| Host | Works? | Note |
|---|---|---|
| VPS (Hetzner, DigitalOcean, Contabo) | ✅ Best | Works as-is |
| Railway / Render with a volume | ✅ | Mount a volume at `data/` |
| Vercel / Netlify | ⚠️ | Read-only filesystem — needs Postgres + S3 first |

On a VPS, keep it running with [PM2](https://pm2.keymetrics.io):

```bash
npm i -g pm2
npm run build
pm2 start npm --name customwear -- start
pm2 save && pm2 startup
```

Then put Nginx or Caddy in front for HTTPS.

**Before it goes public**

1. `ADMIN_PASSWORD` and `ADMIN_SALT` set in `.env.local`
2. `NEXT_PUBLIC_SITE_URL` set to your real domain
3. `url` in `content/site.json` set to the same
4. `npm run reset:db` to clear demo enquiries
5. At least one notification channel working — test it with a real enquiry

---

## Commands

```bash
npm run setup      # install + build (first time)
npm run dev        # development, hot reload
npm start          # production
npm run build      # rebuild after editing content/
npm run seed       # add demo enquiries
npm run reset:db   # wipe the database
npm run check      # typecheck + build, catches errors early
```

Other docs: **`README.md`** how it all works · **`PENDING.md`** what still
needs your input · **`API.md`** endpoints and security · **`CATALOG-CMS.md`**
editing images and content from the admin
