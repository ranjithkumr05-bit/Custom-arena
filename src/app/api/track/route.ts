import { z } from "zod";
import { getRfqByRef } from "@/lib/db";
import { stageIndexFor } from "@/lib/content";
import { fail, ok, padTo, route } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * SECURITY — order references are sequential (CA-YYMM-NNNN), which made this
 * endpoint an enumeration oracle: walking 0001, 0002, 0003 exposed every
 * customer's status, volumes and size breakdowns.
 *
 * The reference alone is therefore no longer sufficient. The caller must also
 * prove they know the last 4 digits of the phone number on the order — a
 * value we never publish, and the same pattern couriers use. That turns a
 * 4-digit sequential guess into a 4-digit sequential guess PLUS a 10,000-way
 * secret, under a strict rate limit.
 *
 * Signed-in buyers skip this entirely via /api/portal, which is scoped to
 * their own number.
 */
const schema = z.object({
  ref: z.string({ error: "Enter your order reference" }).trim().min(3, "Enter your order reference").max(40),
  last4: z
    .string({ error: "Enter the last 4 digits of your phone number" })
    .trim()
    .regex(/^\d{4}$/, "Enter the last 4 digits of your phone number"),
});

export const GET = route({ schema, limit: [10, 60_000], bucket: "track" }, async ({ body }) => {
  const started = Date.now();

  const r = getRfqByRef(body.ref);
  const digits = (r?.phone ?? "").replace(/\D/g, "");
  const matches = !!r && digits.length >= 4 && digits.slice(-4) === body.last4;

  // Identical response and identical timing whether the reference is unknown
  // or the last 4 digits are wrong. Otherwise the difference reveals which
  // references exist.
  if (!matches) {
    await padTo(started);
    return fail("No order matches that reference and phone number.", 404);
  }

  await padTo(started);
  return ok({
    rfq: {
      ref: r.ref,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      qty: r.qty,
      kind: r.kind,
      stageIndex: stageIndexFor(r.status),
      lines: (r.lines ?? []).map((l) => ({
        product: l.product,
        fabric: l.fabric,
        decoration: l.decoration,
        qty: l.qty,
        sizes: l.sizes,
      })),
      timeline: (r.events ?? [])
        .filter((e) => e.type === "status_change" || e.type === "created")
        .map((e) => ({ at: e.at, to: e.to_status, note: e.note })),
    },
  });
});
