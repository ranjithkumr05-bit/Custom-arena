# Deploying CustomWear

---

## The two facts that decide everything

1. **The database is a file** — `data/customapparel.db` plus its `-wal` and `-shm` companions
2. **Uploads are written to disk** — `public/uploads`, `public/artwork`

Both need a **persistent filesystem**. That single constraint rules out the
default serverless setups and points at a small VPS.

---

## Where it can run

| Option | Verdict | Cost | Notes |
|---|---|---|---|
| **VPS** — Hetzner, DigitalOcean, Contabo, Hostinger | ✅ **Recommended** | ₹350–700/mo | Works as-is. Full control. |
| **Railway / Render** with a volume | ✅ Works | ₹600–1,200/mo | Mount a volume at `data/`. Easiest if you dislike servers. |
| **Indian VPS** — E2E Networks, Hostinger IN | ✅ Works | ₹400–900/mo | Lower latency for Indian buyers; matters a little for SEO |
| **Vercel / Netlify** | ⚠️ Not as-is | free–$20 | Read-only filesystem. Needs Postgres + S3 first. |
| **Shared hosting** (cPanel, Hostinger shared) | ❌ No | — | Cannot run a Node process |

**If you are unsure: Hetzner CX22, about €4.5/month.** Cheapest credible
option and more than enough.

---

## Server requirements

| | Minimum | Comfortable |
|---|---|---|
| RAM | 1 GB* | **2 GB** |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 10 GB | **20 GB** |
| OS | Ubuntu 22.04 / Debian 12 | same |
| Node | 20.9+ | 20 LTS or 22 LTS |

\* 1 GB runs the site fine but **the build will fail** — `next build` needs
~1.5 GB. Either add swap, or build elsewhere and upload `.next`.

Disk usage once deployed:

```
source + content     26 MB
node_modules        557 MB
.next build         107 MB
database + uploads  grows slowly
                    ────────
                    ~700 MB + OS
```

Running memory is about **235 MB**. It is a small app; the 557 MB of
`node_modules` is Next.js's own compiler binaries, not your code.

---

## VPS deployment, start to finish

### 1 · Create the server

Ubuntu 22.04, 2 GB RAM. Add your SSH key during creation. Note the IP.

```bash
ssh root@YOUR_SERVER_IP
```

### 2 · A non-root user

Running a web app as root is how a small bug becomes a full compromise.

```bash
adduser customwear
usermod -aG sudo customwear
rsync --archive --chown=customwear:customwear ~/.ssh /home/customwear
su - customwear
```

### 3 · Node 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
node -v      # expect v20.x
```

`build-essential` matters — `better-sqlite3` and `sharp` compile native code.

### 4 · Get the code up

```bash
cd ~
git clone https://github.com/ranjithkumr05-bit/Custom-arena.git customwear
cd customwear
npm ci
```

### 5 · Secrets

```bash
nano .env.local
```

```bash
NODE_ENV=production
ADMIN_PASSWORD=something-long-and-private
ADMIN_SALT=some-random-string-you-invent-once
NEXT_PUBLIC_SITE_URL=https://customwear.in

OWNER_WHATSAPP=919876543210
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
# or
OWNER_EMAIL=you@customwear.in
RESEND_API_KEY=
NOTIFY_FROM=enquiries@customwear.in
```

```bash
chmod 600 .env.local
```

Also set `"url"` in `content/site.json` to the same domain — it feeds every
canonical tag and the sitemap.

### 6 · Build

```bash
npm run build
```

On a 1 GB server this is where you run out of memory. Add swap first:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 7 · Keep it running

```bash
sudo npm i -g pm2
pm2 start npm --name customwear -- start
pm2 save
pm2 startup          # run the line it prints
```

Useful later:

```bash
pm2 logs customwear
pm2 restart customwear
pm2 monit
```

### 8 · Nginx + HTTPS

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/customwear
```

```nginx
server {
    listen 80;
    server_name customwear.in www.customwear.in;

    # Buyer artwork can be several MB; the default 1M rejects it.
    client_max_body_size 12M;

    location / {
        proxy_pass         http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;

        # The rate limiter reads this. Without it every visitor looks like
        # one IP and the first few would exhaust everyone's allowance.
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/customwear /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d customwear.in -d www.customwear.in
```

Certbot installs the certificate and sets up auto-renewal.

### 9 · Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Port 3100 stays closed to the internet — Nginx reaches it over localhost.

### 10 · DNS

At your registrar:

```
A     @      YOUR_SERVER_IP
A     www    YOUR_SERVER_IP
```

Allow up to an hour to propagate.

---

## Backups — do this before your first real enquiry

**SQLite in WAL mode keeps most recent data in the `-wal` file.** Copying only
the `.db` gives you a nearly empty backup. I made exactly this mistake during
development and lost 33 records.

```bash
mkdir -p ~/backups
nano ~/backup.sh
```

```bash
#!/usr/bin/env bash
# Checkpoints the WAL into the main file, then snapshots everything.
set -e
cd /home/customwear/customwear
STAMP=$(date +%F-%H%M)

# .backup is the only safe way to copy a live SQLite database
sqlite3 data/customapparel.db ".backup /home/customwear/backups/db-$STAMP.sqlite"

tar -czf /home/customwear/backups/uploads-$STAMP.tar.gz public/uploads public/artwork
find /home/customwear/backups -mtime +30 -delete
```

```bash
sudo apt install -y sqlite3
chmod +x ~/backup.sh
crontab -e
```

```
0 2 * * * /home/customwear/backup.sh
```

Copy them off the server periodically — a backup on the same disk is not a
backup.

---

## Updating after a change

```bash
cd ~/customwear
git pull
npm ci
npm run build
pm2 restart customwear
```

Roughly 3 minutes, with about 10 seconds of downtime at the restart.

---

## If you must use Vercel

Three changes are needed:

1. **Database** → Postgres (Neon or Supabase). Rewrite `src/lib/db.ts`,
   `catalog.ts`, `portal.ts`. The queries are plain SQL, so this is mechanical
   rather than hard.
2. **Uploads** → S3 or Cloudflare R2. Two `fs` calls in
   `api/admin/media/route.ts` and `api/attachment/route.ts`.
3. **Rate limiter** → Upstash Redis. Replace the `Map` in `ratelimit.ts`; the
   function signature stays the same.

Roughly a day of work. Only worth it if you specifically want serverless.

---

## Before you announce the site

1. `ADMIN_PASSWORD` + `ADMIN_SALT` set — **admin refuses to start without them**
2. `NEXT_PUBLIC_SITE_URL` and `content/site.json → url` on the real domain
3. **WhatsApp number in `site.json`** — every CTA is dead until this is real
4. At least one notification channel, **tested with a real submission**
5. `npm run reset:db` to clear the 9 demo enquiries
6. HTTPS working, `http://` redirecting to `https://`
7. Backup cron running, and restore tested once
8. Submit a test enquiry end to end: form → notification → `/admin` → status
   change → buyer sees it on `/track`

---

## Costs, realistically

| Item | Per year |
|---|---|
| Hetzner CX22 (2 GB) | ~₹4,800 |
| Domain `.in` | ~₹800 |
| HTTPS (Let's Encrypt) | free |
| Resend, 3,000 emails/mo | free |
| WhatsApp Cloud API | free tier, then per conversation |
| n8n (self-host on the same box) | free |
| **Total** | **~₹5,600/year** |

Everything runs on one small server, including n8n if you want it there.
