/**
 * Shared API layer.
 *
 * Every route is wrapped by `route()`, which applies the same guarantees in
 * the same order, so a new endpoint cannot accidentally ship without them:
 *
 *   1. Origin check on state-changing verbs  (CSRF defence in depth)
 *   2. Rate limit                            (abuse / brute force)
 *   3. Authentication                        (admin | buyer | public)
 *   4. Body parsing + Zod validation         (no unvalidated input reaches logic)
 *   5. Uniform error shape                   (no stack traces or internals leak)
 *
 * Handlers receive already-validated data and only express business logic.
 */
import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthed } from "./auth";
import { currentBuyer } from "./portal";
import { clientIp, rateLimit } from "./ratelimit";

export type Audience = "public" | "admin" | "buyer";

export interface Ctx<T> {
  body: T;
  url: URL;
  ip: string;
  /** Raw request — needed by routes that read multipart rather than JSON. */
  req: Request;
  /** Normalised phone of the signed-in buyer, when audience is "buyer". */
  buyer: string | null;
}

interface RouteOpts<S extends z.ZodTypeAny | undefined> {
  auth?: Audience;
  schema?: S;
  /** [requests, windowMs] */
  limit?: [number, number];
  /** Bucket name, so different verbs on one path can be limited separately. */
  bucket?: string;
}

export function ok(data: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...data });
}

export function fail(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/**
 * Reject cross-site state changes.
 *
 * SameSite=Lax already blocks the cookie on cross-site POST, so this is a
 * second independent control rather than the only one. Requests with no
 * Origin (server-to-server, curl) are allowed through — they carry no
 * ambient cookie authority, which is the thing CSRF abuses.
 */
function originAllowed(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const host = req.headers.get("host");
  try {
    const o = new URL(origin);
    if (host && o.host === host) return true;
  } catch {
    return false;
  }

  const allow = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (allow.includes(origin)) return true;

  // The sandbox preview is proxied through a generated e2b host.
  if (/^https:\/\/[\w-]+\.e2b\.(app|dev)$/.test(origin)) return true;

  return false;
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function route<S extends z.ZodTypeAny | undefined = undefined>(
  opts: RouteOpts<S>,
  handler: (
    ctx: Ctx<S extends z.ZodTypeAny ? z.infer<S> : undefined>
  ) => Promise<Response> | Response
) {
  return async (req: Request): Promise<Response> => {
    try {
      const url = new URL(req.url);
      const ip = clientIp(req);

      if (MUTATING.has(req.method) && !originAllowed(req)) {
        return fail("Cross-origin request rejected", 403);
      }

      if (opts.limit) {
        const [n, windowMs] = opts.limit;
        const key = `${opts.bucket ?? url.pathname}:${req.method}:${ip}`;
        const rl = rateLimit(key, n, windowMs);
        if (!rl.ok) {
          return NextResponse.json(
            { ok: false, error: `Too many requests. Try again in ${rl.retryAfter}s.` },
            { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
          );
        }
      }

      let buyer: string | null = null;
      if (opts.auth === "admin") {
        if (!(await isAuthed())) return fail("Unauthorised", 401);
      } else if (opts.auth === "buyer") {
        buyer = await currentBuyer();
        if (!buyer) return fail("Not signed in", 401);
      }

      let body: unknown = undefined;
      if (opts.schema) {
        let raw: unknown;
        if (MUTATING.has(req.method)) {
          try {
            raw = await req.json();
          } catch {
            return fail("Expected a JSON body", 400);
          }
        } else {
          raw = Object.fromEntries(url.searchParams);
        }
        const parsed = (opts.schema as z.ZodTypeAny).safeParse(raw);
        if (!parsed.success) {
          const errors: Record<string, string> = {};
          for (const i of parsed.error.issues) {
            const k = i.path.join(".") || "_";
            if (!errors[k]) errors[k] = i.message;
          }
          return fail(Object.values(errors)[0] ?? "Validation failed", 400, { errors });
        }
        body = parsed.data;
      }

      return await handler({
        body: body as S extends z.ZodTypeAny ? z.infer<S> : undefined,
        url,
        ip,
        req,
        buyer,
      });
    } catch (err) {
      // Log server-side; never return the message or stack to the client.
      console.error(`[api] ${req.method} ${req.url}`, err);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}

/**
 * Constant-time-ish padding.
 *
 * Endpoints that must not reveal whether a record exists still branch into
 * different amounts of work. Padding every response to a floor removes the
 * timing signal that would otherwise leak the answer.
 */
export async function padTo(startedAt: number, floorMs = 220) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < floorMs) await new Promise((r) => setTimeout(r, floorMs - elapsed));
}
