import { z } from "zod";
import { createSession, destroySession, sweepSessions, verifyPassword } from "@/lib/auth";
import { fail, ok, padTo, route } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({ password: z.string().min(1, "Password required").max(200) });

export const POST = route(
  { schema, limit: [8, 15 * 60_000], bucket: "login" },
  async ({ body }) => {
    const started = Date.now();
    const valid = verifyPassword(body.password);
    // Flat response time regardless of outcome.
    await padTo(started, 300);
    if (!valid) return fail("Incorrect password", 401);
    sweepSessions();
    await createSession();
    return ok();
  }
);

export const DELETE = route({}, async () => {
  await destroySession();
  return ok();
});
