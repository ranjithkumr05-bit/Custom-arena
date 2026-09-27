import { listRfqs } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

const COLS = [
  "ref", "created_at", "status", "priority", "score", "name", "organisation",
  "phone", "email", "city", "buyer_type", "qty", "est_low", "est_high",
  "required_by", "lines", "notes",
];

function esc(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  if (!(await isAuthed())) {
    return new Response("Unauthorised", { status: 401 });
  }

  const rows = listRfqs({ limit: 5000 });

  const body = [
    COLS.join(","),
    ...rows.map((r) =>
      COLS.map((c) => {
        if (c === "lines") {
          return esc(
            (r.lines ?? [])
              .map(
                (l) =>
                  `${l.qty}x ${l.product}/${l.fabric}/${l.decoration} [${Object.entries(l.sizes)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(" ")}]`
              )
              .join(" | ")
          );
        }
        return esc((r as unknown as Record<string, unknown>)[c]);
      }).join(",")
    ),
  ].join("\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("\uFEFF" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rfqs-${stamp}.csv"`,
    },
  });
}
