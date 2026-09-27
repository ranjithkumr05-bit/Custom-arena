import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAuthed } from "@/lib/auth";
import { catKey, catalogHistory, resetPatch, resolveCatalog, savePatch, subKey } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * Slugs are constrained to the shape the catalog actually uses, and then
 * checked against the live catalog below. A patch can therefore never create
 * an orphan override row for an entity that does not exist.
 */
const slug = z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/, "Invalid slug");

const patchSchema = z.object({
  kind: z.enum(["category", "subcategory"]),
  cat: slug,
  sub: slug.optional(),
  patch: z
    .record(
      z.string(),
      z.union([z.string().max(2000), z.number().finite(), z.boolean(), z.null()])
    )
    .refine((o) => Object.keys(o).length <= 12, "Too many fields"),
});

const resetSchema = z.object({
  kind: z.enum(["category", "subcategory"]),
  cat: slug,
  sub: slug.optional(),
});

/** Public pages are static; edits must invalidate the affected routes. */
function revalidate(cat: string, sub?: string) {
  revalidatePath("/");
  revalidatePath("/what-we-make");
  revalidatePath(`/what-we-make/${cat}`);
  if (sub) revalidatePath(`/what-we-make/${cat}/${sub}`);
  revalidatePath("/sitemap.xml");
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  return NextResponse.json({ catalog: resolveCatalog(), history: catalogHistory() });
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { kind, cat, sub, patch } = parsed.data;
  if (kind === "subcategory" && !sub) {
    return NextResponse.json({ error: "sub is required" }, { status: 400 });
  }

  // The target must exist. Prevents writing overrides for invented slugs.
  const live = resolveCatalog().find((c) => c.slug === cat);
  if (!live) return NextResponse.json({ error: "Unknown category" }, { status: 404 });
  if (sub && !live.subcategories.some((s) => s.slug === sub)) {
    return NextResponse.json({ error: "Unknown subcategory" }, { status: 404 });
  }

  const key = kind === "category" ? catKey(cat) : subKey(cat, sub!);
  const next = savePatch(key, kind, patch);
  revalidate(cat, sub);

  return NextResponse.json({ ok: true, patch: next, catalog: resolveCatalog() });
}

export async function DELETE(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = resetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { kind, cat, sub } = parsed.data;
  const key = kind === "category" ? catKey(cat) : subKey(cat, sub!);
  resetPatch(key);
  revalidate(cat, sub);

  return NextResponse.json({ ok: true, catalog: resolveCatalog() });
}
