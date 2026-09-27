/**
 * In-memory sliding-window rate limiter.
 *
 * Adequate for a single-instance deployment. Behind multiple instances or
 * serverless, swap the Map for Redis / Upstash — the signature stays the same.
 */
type Hit = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __caRate: Map<string, Hit> | undefined;
}
const buckets = globalThis.__caRate ?? (globalThis.__caRate = new Map());

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hit = buckets.get(key);

  if (!hit || hit.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  hit.count += 1;
  if (hit.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((hit.resetAt - now) / 1000),
    };
  }
  return { ok: true, remaining: limit - hit.count, retryAfter: 0 };
}

export function clientIp(req: Request) {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/** Periodically drop stale buckets so the Map cannot grow unbounded. */
if (!globalThis.__caRateSweep) {
  globalThis.__caRateSweep = true;
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }, 60_000).unref?.();
}

declare global {
  // eslint-disable-next-line no-var
  var __caRateSweep: boolean | undefined;
}
