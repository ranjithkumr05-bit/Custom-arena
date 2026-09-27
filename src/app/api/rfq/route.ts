import { claimFiles, createRfq, getRfqById, listRfqs } from "@/lib/db";
import { rfqSchema } from "@/lib/schema";
import { rateLimit } from "@/lib/ratelimit";
import { notifyNewRfq } from "@/lib/notify";
import { fail, ok, route } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * A loose ceiling (30/10min) is applied by the wrapper to stop hammering.
 * A stricter one is applied below, but only to submissions that actually
 * validate — a buyer fixing a typo must not be locked out.
 */
export const POST = route(
  { schema: rfqSchema, limit: [30, 10 * 60_000], bucket: "rfq" },
  async ({ body, ip }) => {
    const accepted = rateLimit(`rfq:accepted:${ip}`, 5, 10 * 60_000);
    if (!accepted.ok) {
      return fail(
        `You have submitted several enquiries already. Try again in ${accepted.retryAfter}s, or message us on WhatsApp.`,
        429
      );
    }

    const rfq = createRfq({
      kind: body.kind,
      name: body.name,
      organisation: body.organisation,
      phone: body.phone,
      email: body.email,
      city: body.city,
      buyerType: body.buyerType,
      colour: body.colour,
      requiredBy: body.requiredBy,
      notes: body.notes,
      attribution: body.attribution,
      lines: body.lines.map((l) => ({
        product: l.product, fabric: l.fabric, decoration: l.decoration,
        positions: l.positions, colour: l.colour, sizes: l.sizes,
        qty: l.qty, est_low: l.est_low, est_high: l.est_high,
      })),
    });

    // Link any artwork uploaded before the enquiry existed.
    const files = body.attachmentIds.length
      ? claimFiles(rfq.id, body.attachmentIds, body.uploadToken)
      : [];

    const full = getRfqById(rfq.id) ?? rfq;
    const channels = await notifyNewRfq(full, files);

    return ok({
      ref: rfq.ref,
      priority: rfq.priority,
      score: rfq.score,
      attachments: files.length,
      notified: channels.filter((c) => c.sent).map((c) => c.channel),
    });
  }
);

export const GET = route({ auth: "admin" }, async ({ url }) => {
  const rows = listRfqs({
    status: url.searchParams.get("status") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  return ok({ count: rows.length, rfqs: rows });
});
