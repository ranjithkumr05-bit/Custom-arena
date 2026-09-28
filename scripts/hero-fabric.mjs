/**
 * Hero backdrop asset prep.
 *
 * Turns a source photograph into the landing-page hero backdrop, using the
 * same pipeline semantics the media library applies to uploads:
 *
 *   - re-encoded to WebP (EXIF stripped as a side effect — a phone shot
 *     carries GPS, and the hero is the most-published image on the site)
 *   - capped at its native width: no enlargement. Inventing pixels the
 *     camera never captured is the image equivalent of an unverified
 *     number, and the backdrop renders under a scrim so softness is moot.
 *   - a 20px placeholder is emitted for next/image `placeholder="blur"`,
 *     so the hero never flashes flat navy on first paint.
 *
 *   node scripts/hero-fabric.mjs "C:/path/to/source.jpg"
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error("usage: node scripts/hero-fabric.mjs <source-image>");
  process.exit(1);
}

const out = path.join(process.cwd(), "public", "banners", "hero-fabric.webp");

const meta = await sharp(src).metadata();
console.log(`source   ${meta.width}x${meta.height} ${meta.format}`);

const info = await sharp(src)
  .resize({ width: 1920, withoutEnlargement: true })
  .webp({ quality: 80, effort: 6 })
  .toFile(out);

console.log(
  `written  ${path.relative(process.cwd(), out)}  ` +
  `${(info.size / 1024).toFixed(1)} KB  ${info.width}x${info.height}`
);

const lqip = await sharp(src).resize(20).webp({ quality: 40 }).toBuffer();
console.log(`\nblurDataURL:\n"data:image/webp;base64,${lqip.toString("base64")}"`);
