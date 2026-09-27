import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import sharp, { type Metadata } from "sharp";
import { isAuthed } from "@/lib/auth";
import { addMedia, deleteMedia, listMedia, mediaFolders, seedImages } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/** Wide banner/card use — anything larger is wasted bytes on the wire. */
const MAX_W = 2000;

function slugify(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "image";
}

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const folder = new URL(req.url).searchParams.get("folder") ?? undefined;
  return NextResponse.json({
    media: listMedia(folder),
    folders: mediaFolders(),
    seed: seedImages(),
  });
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  const folder = String(form.get("folder") ?? "general").replace(/[^a-z0-9-]/gi, "") || "general";
  const alt = String(form.get("alt") ?? "").slice(0, 300);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file supplied" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type ${file.type || "unknown"}. Use JPG, PNG, WebP or AVIF.` },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File is ${(file.size / 1048576).toFixed(1)} MB. Maximum is 12 MB.` },
      { status: 413 }
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  // Decode defensively — a file can claim image/jpeg and be anything.
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
    if (!meta.width || !meta.height) throw new Error("no dimensions");
  } catch {
    return NextResponse.json({ error: "That file is not a readable image." }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const base = `${slugify(file.name)}-${randomBytes(4).toString("hex")}`;
  const filename = `${base}.webp`;

  // Normalise everything to WebP. Re-encoding also strips EXIF, which can
  // carry GPS coordinates from a phone camera.
  const pipeline = sharp(input).rotate();
  if ((meta.width ?? 0) > MAX_W) pipeline.resize({ width: MAX_W, withoutEnlargement: true });
  const out = await pipeline.webp({ quality: 82 }).toBuffer();
  const outMeta = await sharp(out).metadata();

  await fs.writeFile(path.join(UPLOAD_DIR, filename), out);

  // 20px inline placeholder so cards never flash empty.
  const tiny = await sharp(out).resize(20).webp({ quality: 40 }).toBuffer();
  const placeholder = `data:image/webp;base64,${tiny.toString("base64")}`;

  const item = addMedia({
    filename,
    original_name: file.name,
    url: `/uploads/${filename}`,
    mime: "image/webp",
    bytes: out.length,
    width: outMeta.width ?? 0,
    height: outMeta.height ?? 0,
    alt,
    placeholder,
    folder,
  });

  return NextResponse.json({
    ok: true,
    media: item,
    savedBytes: Math.max(0, file.size - out.length),
  });
}

export async function DELETE(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const m = deleteMedia(id);
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Remove the file too, but a missing file must not fail the request.
  try {
    await fs.unlink(path.join(UPLOAD_DIR, m.filename));
  } catch { /* already gone */ }

  return NextResponse.json({ ok: true });
}
