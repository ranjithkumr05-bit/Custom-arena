import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import sharp from "sharp";
import { addRfqFile, sweepOrphanFiles } from "@/lib/db";
import { fail, ok, route } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Public artwork upload.
 *
 * A buyer attaching their logo before submitting removes the biggest source
 * of quoting error. Screen print is priced per colour and embroidery on
 * stitch count — both of which we are guessing at until we see the artwork.
 * So this also counts distinct colours and returns it, which feeds the
 * branding recommendation shown next to the upload.
 *
 * SECURITY — unauthenticated, so the most exposed endpoint on the site:
 *   - decoded by sharp before anything touches disk, so a file claiming
 *     image/png that will not decode is rejected
 *   - re-encoded to WebP, which strips EXIF (phone photos carry GPS)
 *   - randomised filenames, so uploads cannot be enumerated
 *   - 12 uploads per 30 minutes per IP
 *   - orphans never attached to an enquiry are swept after 24 hours
 *
 * PDF and vector files are deliberately refused. Serving user-supplied PDFs
 * from our own origin is a real XSS vector; the form tells the buyer to send
 * those on WhatsApp instead.
 */

const DIR = path.join(process.cwd(), "public", "artwork");
const MAX = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * Count the colours a printer would actually have to separate.
 *
 * A naive distinct-value count is useless: a flat two-colour logo returns ~20
 * because every anti-aliased edge pixel is a unique blend. A screen printer
 * does not make a screen for an edge fringe.
 *
 * So colours are bucketed, then only those covering at least 1.5% of the
 * image are counted. That drops anti-aliasing and JPEG noise while keeping
 * every colour a separation would be cut for.
 */
async function countColours(buf: Buffer) {
  try {
    const { data, info } = await sharp(buf)
      .resize(96, 96, { fit: "inside" })
      .flatten({ background: "#ffffff" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bucket = new Map<number, number>();
    let total = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
      total++;
    }
    if (!total) return 0;

    const floor = total * 0.015;
    const significant = [...bucket.values()].filter((n) => n >= floor).length;

    // A photograph has no dominant buckets at all — everything falls below
    // the floor. Report it as many-coloured rather than as zero.
    if (significant === 0) return 99;
    return significant;
  } catch {
    return 0;
  }
}

export const POST = route({ limit: [12, 30 * 60_000], bucket: "attachment" }, async ({ req }) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Expected multipart/form-data", 400);
  }

  const file = form.get("file");
  const token = String(form.get("token") ?? "").slice(0, 64);

  if (!(file instanceof File)) return fail("No file supplied", 400);
  if (!token || token.length < 16) return fail("Missing upload token", 400);
  if (!ALLOWED.has(file.type)) {
    return fail(
      `We can only read images here (JPG, PNG, WebP). For PDF, AI or CDR artwork, send it on WhatsApp after submitting.`,
      415
    );
  }
  if (file.size > MAX) {
    return fail(`That file is ${(file.size / 1048576).toFixed(1)} MB. Maximum is 8 MB.`, 413);
  }

  const input = Buffer.from(await file.arrayBuffer());

  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input).metadata();
    if (!meta.width || !meta.height) throw new Error("no dimensions");
  } catch {
    return fail("That file is not a readable image.", 400);
  }

  sweepOrphanFiles();
  await fs.mkdir(DIR, { recursive: true });

  const filename = `${randomBytes(10).toString("hex")}.webp`;
  const pipeline = sharp(input).rotate();
  if ((meta.width ?? 0) > 1600) pipeline.resize({ width: 1600, withoutEnlargement: true });
  const out = await pipeline.webp({ quality: 88 }).toBuffer();
  const outMeta = await sharp(out).metadata();

  await fs.writeFile(path.join(DIR, filename), out);

  const tiny = await sharp(out).resize(16).webp({ quality: 40 }).toBuffer();
  const colours = await countColours(out);

  const row = addRfqFile({
    claim_token: token,
    filename,
    original_name: file.name.slice(0, 160),
    url: `/artwork/${filename}`,
    mime: "image/webp",
    bytes: out.length,
    width: outMeta.width ?? 0,
    height: outMeta.height ?? 0,
    colours,
    placeholder: `data:image/webp;base64,${tiny.toString("base64")}`,
  });

  // Turn the colour count into advice the buyer can act on.
  let hint = "";
  if (colours > 0 && colours <= 4) {
    hint = `About ${colours} flat colour${colours > 1 ? "s" : ""} — screen print will be cheapest at volume.`;
  } else if (colours <= 12) {
    hint = `Around ${colours} colours — DTF avoids a per-colour setup charge.`;
  } else {
    hint = "Photographic or many-coloured — DTF or DTG, not screen print.";
  }

  return ok({
    file: {
      id: row.id, url: row.url, original_name: row.original_name,
      width: row.width, height: row.height, bytes: row.bytes,
      colours: row.colours, placeholder: row.placeholder,
    },
    hint,
  });
});
