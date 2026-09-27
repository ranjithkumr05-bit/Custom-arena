import { updateStatus } from "@/lib/db";
import { statusSchema } from "@/lib/schema";
import { dispatch } from "@/lib/webhook";
import { fail, ok, route } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = route(
  { auth: "admin", schema: statusSchema, limit: [120, 60_000], bucket: "status" },
  async ({ body }) => {
    const updated = updateStatus(body.ref, body.status, body.note);
    if (!updated) return fail("Not found", 404);

    if (["quoted", "in_production", "dispatched"].includes(body.status)) {
      await dispatch("rfq.status_changed", {
        ref: updated.ref, status: updated.status, name: updated.name,
        phone: updated.phone, email: updated.email, note: body.note,
      });
    }
    return ok({ rfq: updated });
  }
);
