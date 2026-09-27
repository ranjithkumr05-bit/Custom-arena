#!/usr/bin/env bash
#
# One-command recovery.
#
# The sandbox reclaims node_modules, .next and any running process between
# sessions. Source, content and the database survive. This script inspects
# what is actually missing and repairs only that, so a warm start is seconds
# and a cold start is one predictable path rather than a guess.
#
#   ./start.sh           repair if needed, then serve
#   ./start.sh --fresh   force a clean reinstall and rebuild
#
set -euo pipefail
cd "$(dirname "$0")"

PORT=3100
FRESH=${1:-}
say() { printf "\033[36m▸\033[0m %s\n" "$1"; }
ok()  { printf "\033[32m✓\033[0m %s\n" "$1"; }

if [ "$FRESH" = "--fresh" ]; then
  say "clean slate requested"
  rm -rf node_modules .next
fi

# ── stop anything already bound to the port ───────────────────────────
if lsof -ti:$PORT >/dev/null 2>&1; then
  say "freeing port $PORT"
  lsof -ti:$PORT | xargs -r kill -9 2>/dev/null || true
  sleep 1
fi

# ── dependencies ──────────────────────────────────────────────────────
# Plain `npm ci`. Two optimisations were tried and both rejected:
#
#   pnpm            faster only if its store survives; the default store
#                   lives under ~/.local which is reclaimed like everything
#                   else, and relocating it somewhere persistent blows the
#                   workspace size budget.
#
#   --libc/--os/--cpu filters   measured at 567s versus ~135s, and every
#                   musl and wasm binary was still installed. The earlier
#                   "it works" reading came from a test where npm ci had
#                   silently failed, so the directories were absent because
#                   nothing installed at all — not because they were pruned.
#
# There is no install-time win here. ~2 minutes cold is the floor.
if [ ! -d node_modules ] || [ ! -d node_modules/next ]; then
  say "installing dependencies (lockfile, no resolution)"
  npm ci --no-audit --no-fund --loglevel=error
  ok "dependencies restored ($(du -sh node_modules 2>/dev/null | cut -f1))"
else
  ok "dependencies present"
fi

# Pruning or a partial install can leave a module present but unloadable.
# Verify rather than trust the directory listing.
node -e "require('next');require('sharp');require('better-sqlite3');require('zod')" 2>/dev/null \
  || { say "native modules did not load — clean reinstall"
       rm -rf node_modules
       npm ci --no-audit --no-fund --loglevel=error; }

# ── build ─────────────────────────────────────────────────────────────
if [ ! -d .next ] || [ ! -f .next/BUILD_ID ]; then
  say "building"
  npm run build >/tmp/build.log 2>&1 || { tail -25 /tmp/build.log; exit 1; }
  ok "build complete"
else
  ok "build present"
fi

# ── database ──────────────────────────────────────────────────────────
mkdir -p data public/uploads public/artwork
if [ -f data/customapparel.db ]; then
  ok "database present ($(node -e "
    try{const D=require('better-sqlite3');
    console.log(new D('data/customapparel.db',{readonly:true}).prepare('SELECT COUNT(*) n FROM rfqs').get().n+' enquiries')}
    catch(e){console.log('new')}" 2>/dev/null))"
else
  ok "database will be created on first write"
fi

# ── serve ─────────────────────────────────────────────────────────────
# Production build, not `next dev`: lighter, and it survived load testing
# that repeatedly killed the dev server in this sandbox.
say "starting on :$PORT"
exec env CA_ALLOW_DEMO_AUTH=1 npx next start -H 0.0.0.0 -p $PORT
