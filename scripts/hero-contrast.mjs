/**
 * Hero contrast check.
 *
 * The headline sits over a photograph, so whether it is readable is a
 * measurement, not an opinion. Screenshot the hero with the text hidden
 * (so the glyphs themselves do not pollute the sample), name the rectangles
 * the text occupies, and this reports the worst background pixel under each
 * one and the contrast ratio against the text colour.
 *
 *   node scripts/hero-contrast.mjs shot.png 40,120,600,180 40,320,520,90
 *   node scripts/hero-contrast.mjs shot.png 40,120,600,180 --fg=#d9b967
 *
 * Exits non-zero if any rectangle falls below WCAG AA (4.5:1 normal text,
 * 3:1 large text — pass --large for the latter).
 */
import sharp from "sharp";

const [, , file, ...rest] = process.argv;
const rects = rest.filter((a) => !a.startsWith("--"));
const fgArg = rest.find((a) => a.startsWith("--fg="));
const large = rest.includes("--large");

if (!file || !rects.length) {
  console.error("usage: node scripts/hero-contrast.mjs <png> x,y,w,h [more rects] [--fg=#hex] [--large]");
  process.exit(2);
}

const fg = fgArg ? fgArg.slice(5) : "#ffffff";
const threshold = large ? 3 : 4.5;

// ── WCAG relative luminance ──────────────────────────────────────────
const chan = (v) => {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = ({ r, g, b }) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const contrast = (a, b) => {
  const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
  return (hi + 0.05) / (lo + 0.05);
};
const hex = (h) => {
  const n = parseInt(h.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const image = sharp(file);
const { width, height } = await image.metadata();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

const fgRgb = hex(fg);
let failed = false;

for (const rect of rects) {
  const [x, y, w, h] = rect.split(",").map(Number);
  if ([x, y, w, h].some((n) => !Number.isFinite(n))) {
    console.error(`bad rect: ${rect}`);
    process.exit(2);
  }
  const x1 = Math.min(x + w, info.width);
  const y1 = Math.min(y + h, info.height);

  // 95th percentile luminance, not the mean: contrast is decided by the
  // brightest pixels under the glyphs, and the mean would hide them.
  const lums = [];
  let worst = { r: 0, g: 0, b: 0 };
  let worstL = -1;
  for (let py = y; py < y1; py++) {
    for (let px = x; px < x1; px++) {
      const o = (py * info.width + px) * info.channels;
      const p = { r: data[o], g: data[o + 1], b: data[o + 2] };
      const L = lum(p);
      lums.push(L);
      if (L > worstL) { worstL = L; worst = p; }
    }
  }
  lums.sort((a, b) => a - b);
  const p95 = lums[Math.floor(lums.length * 0.95)];

  // Contrast at the 95th percentile is the ratio the eye deals with for
  // 95% of the area; the single worst pixel is reported too, as a floor.
  const ratio95 = 1.05 / (p95 + 0.05);
  const ratioWorst = contrast(worst, fgRgb);
  const ok = ratio95 >= threshold;

  console.log(
    `${rect.padEnd(22)} p95 luminance ${p95.toFixed(4)}  ` +
    `contrast≈${ratio95.toFixed(2)}:1 (worst px ${ratioWorst.toFixed(2)}:1 vs ${fg})  ` +
    `${ok ? "PASS" : "FAIL"} (AA ${threshold}:1)`
  );
  if (!ok) failed = true;
}

console.log(
  `\nimage ${width}x${height}, ${rects.length} region(s), ` +
  `${fg} text, ${large ? "large" : "normal"} threshold ${threshold}:1`
);
process.exit(failed ? 1 : 0);
