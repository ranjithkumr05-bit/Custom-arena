import { z } from "zod";
import { dispatch } from "@/lib/webhook";
import { fail, ok, padTo, route } from "@/lib/api";
import {
  buyerExists, currentBuyer, endSession, issueCode, normalisePhone,
  orderFor, ordersFor, startSession, sweepPortal, verifyCode,
} from "@/lib/portal";

export const dynamic = "force-dynamic";

const phone = z.string().trim().min(6).max(20).regex(/^[+\d][\d\s-]{5,19}$/, "Enter a valid phone number");

const postSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), phone }),
  z.object({ action: z.literal("verify"), phone, code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") }),
]);

export const GET = route({ auth: "buyer", limit: [90, 60_000], bucket: "portal-read" }, async ({ url, buyer }) => {
  const ref = url.searchParams.get("ref");
  if (ref) {
    // Scoped to the signed-in number, so one buyer cannot read another's order.
    const order = orderFor(buyer!, ref);
    if (!order) return fail("Not found", 404);
    return ok({ signedIn: true, order });
  }
  return ok({ signedIn: true, phone: buyer, orders: ordersFor(buyer!) });
});

export const POST = route(
  { schema: postSchema, limit: [12, 15 * 60_000], bucket: "portal-auth" },
  async ({ body }) => {
    const started = Date.now();

    if (body.action === "verify") {
      const res = verifyCode(body.phone, body.code);
      await padTo(started);
      if (!res.ok) {
        return fail(
          {
            no_code: "No code was requested for this number. Start again.",
            expired: "That code has expired. Request a new one.",
            too_many: "Too many wrong attempts. Request a new code.",
            wrong: "That code is not correct.",
          }[res.reason],
          401
        );
      }
      await startSession(body.phone);
      return ok();
    }

    sweepPortal();
    const p = normalisePhone(body.phone);

    if (!buyerExists(p)) {
      // Identical body AND identical timing to the success path. Revealing
      // which numbers exist would expose the customer list.
      await padTo(started, 400);
      return ok({ sent: true });
    }

    const code = issueCode(p);
    const hook = await dispatch("buyer.code", { phone: p, code, channel: "whatsapp" });
    await padTo(started, 400);

    return ok({
      sent: true,
      // Only ever returned when there is no delivery channel configured.
      demoCode: hook.sent ? undefined : code,
      delivery: hook.sent ? "whatsapp" : "not configured",
    });
  }
);

export const DELETE = route({}, async () => {
  await endSession();
  return ok();
});

export { currentBuyer };
