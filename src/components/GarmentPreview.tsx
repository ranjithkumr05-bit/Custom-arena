"use client";

/**
 * Live SVG garment preview.
 *
 * Renders a tee, polo, hoodie or jersey in the chosen colour and shows where
 * branding will sit. Pure SVG — no images, scales to any size, stays sharp.
 * Contrast for seams and print zones is derived from the garment's luminance
 * so it stays visible on white and on navy.
 *
 * SILHOUETTE NOTES
 * The first version read as a women's top. Three causes, all common:
 *   1. Neck opening 80 wide x 23 deep — a scoop, not a crew.
 *   2. Shoulders (80) narrower than the body (92), so the sides flared out.
 *   3. Body 0.59 as wide as it was long — tunic proportions.
 *
 * Now matched to a real men's flat-lay: chest ~52cm by length ~72cm gives a
 * width:length ratio of about 0.7, and sleeve-to-sleeve about 1.4x the chest.
 * Here that is a 92-wide body over 134 of length, with a 130 sleeve span and
 * a 48 x 15 crew neck.
 */

export const GARMENT_COLOURS = [
  { name: "Navy", hex: "#0b1f3a" },
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#f7f7f5" },
  { name: "Gold", hex: "#c8a24a" },
  { name: "Maroon", hex: "#6b1f2e" },
  { name: "Bottle green", hex: "#14452f" },
  { name: "Royal blue", hex: "#1c4fb5" },
  { name: "Red", hex: "#b52025" },
  { name: "Grey melange", hex: "#9b9b96" },
  { name: "Sand", hex: "#d9cdb4" },
  { name: "Sky", hex: "#7fb3d9" },
  { name: "Olive", hex: "#5c6142" },
];

export type Placement = "left-chest" | "centre-chest" | "full-front" | "back" | "sleeve";

export const PLACEMENTS: { id: Placement; label: string }[] = [
  { id: "left-chest", label: "Left chest" },
  { id: "centre-chest", label: "Centre chest" },
  { id: "full-front", label: "Full front" },
  { id: "back", label: "Back" },
  { id: "sleeve", label: "Sleeve" },
];

function luminance(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Darken a hex by a ratio — used for the hood, which sits behind the body. */
function shade(hex: string, amount = 0.18) {
  const h = hex.replace("#", "");
  const n = [0, 2, 4].map((i) => Math.max(0, Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - amount))));
  return `#${n.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const TEE_BODY =
  "M76 12 L62 18 L35 31 L41 72 L54 68 L54 152 L146 152 L146 68 L159 72 L165 31 L138 18 L124 12 C119 23 111 27 100 27 C89 27 81 23 76 12 Z";

const HOODIE_BODY =
  "M72 40 L56 46 L28 60 L35 106 L50 101 L50 158 L150 158 L150 101 L165 106 L172 60 L144 46 L128 40 C121 53 112 57 100 57 C88 57 79 53 72 40 Z";

export default function GarmentPreview({
  product = "tee",
  colour = "#0b1f3a",
  placement = "left-chest",
  method = "dtf",
  positions = 1,
}: {
  product?: string;
  colour?: string;
  placement?: Placement;
  method?: string;
  positions?: number;
}) {
  const light = luminance(colour) > 0.45;
  const seam = light ? "rgba(0,0,0,.24)" : "rgba(255,255,255,.28)";
  const zone = light ? "rgba(0,0,0,.32)" : "rgba(255,255,255,.46)";
  const zoneFill = light ? "rgba(0,0,0,.055)" : "rgba(255,255,255,.10)";

  const isHoodie = product === "hoodie";
  const isPolo = product === "polo";
  const isJersey = product === "jersey";
  const body = isHoodie ? HOODIE_BODY : TEE_BODY;

  // Sublimation covers the whole panel rather than sitting in a zone.
  const allOver = method === "sublimation" && (placement === "full-front" || placement === "back");

  // Hoodie bodies sit ~28 lower to make room for the hood.
  const dy = isHoodie ? 28 : 0;
  const zones: Record<Placement, { x: number; y: number; w: number; h: number; r: number }> = {
    "left-chest": { x: 108, y: 46 + dy, w: 24, h: 20, r: 2 },
    "centre-chest": { x: 76, y: 48 + dy, w: 48, h: 22, r: 2 },
    "full-front": { x: 66, y: 44 + dy, w: 68, h: 84, r: 3 },
    back: { x: 66, y: 44 + dy, w: 68, h: 84, r: 3 },
    sleeve: { x: 40, y: 38 + dy, w: 18, h: 16, r: 2 },
  };
  const z = zones[placement];

  return (
    <svg viewBox="0 0 200 176" className="size-full" role="img"
      aria-label={`${product} preview in the selected colour with branding at ${placement.replace("-", " ")}`}>
      <defs>
        <linearGradient id="gp-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity={light ? 0.1 : 0.2} />
          <stop offset="34%" stopColor="#000" stopOpacity="0" />
          <stop offset="70%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity={light ? 0.12 : 0.24} />
        </linearGradient>
        <clipPath id="gp-clip"><path d={body} /></clipPath>
      </defs>

      {/* HOOD — drawn first so the shoulder line cuts across it. Drawn on top
          it reads as a helmet sitting above the garment. */}
      {isHoodie && (
        <>
          <path d="M56 58 C58 26 76 13 100 13 C124 13 142 26 144 58 Z" fill={shade(colour, 0.2)} />
          <path d="M56 58 C58 26 76 13 100 13 C124 13 142 26 144 58" fill="none" stroke={seam} strokeWidth="1.2" />
          <path d="M72 46 C76 30 86 22 100 22 C114 22 124 30 128 46" fill="none" stroke={seam} strokeWidth="1" opacity=".7" />
        </>
      )}

      {/* BODY */}
      <path d={body} fill={colour} />
      <path d={body} fill="url(#gp-shade)" />

      {/* sublimation panel print */}
      {allOver && (
        <g clipPath="url(#gp-clip)">
          <rect x="0" y="0" width="200" height="176"
            fill={light ? "rgba(11,31,58,.16)" : "rgba(200,162,74,.20)"} />
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={i} d={`M${-40 + i * 30} 176 L${20 + i * 30} 0`}
              stroke={light ? "rgba(11,31,58,.26)" : "rgba(200,162,74,.34)"} strokeWidth="9" />
          ))}
        </g>
      )}

      {/* jersey contrast side panels */}
      {isJersey && !allOver && (
        <g clipPath="url(#gp-clip)">
          <path d="M54 68 L72 68 L65 152 L54 152 Z" fill={light ? "#0b1f3a" : "#c8a24a"} opacity=".42" />
          <path d="M146 68 L128 68 L135 152 L146 152 Z" fill={light ? "#0b1f3a" : "#c8a24a"} opacity=".42" />
        </g>
      )}

      {/* hoodie front detail: drawcords, pocket, ribbed hem */}
      {isHoodie && (
        <>
          <circle cx="90" cy="56" r="2.1" fill={seam} />
          <circle cx="110" cy="56" r="2.1" fill={seam} />
          <path d="M90 58 C89 70 88 79 87 87" fill="none" stroke={seam} strokeWidth="2" strokeLinecap="round" />
          <path d="M110 58 C111 70 112 79 113 87" fill="none" stroke={seam} strokeWidth="2" strokeLinecap="round" />
          <path d="M60 112 L140 112 L136 144 L64 144 Z" fill="none" stroke={seam} strokeWidth="1.1" />
          <rect x="50" y="146" width="100" height="12" fill="none" stroke={seam} strokeWidth="1.1" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={54 + i * 8.5} y1="146" x2={54 + i * 8.5} y2="158" stroke={seam} strokeWidth=".7" opacity=".7" />
          ))}
        </>
      )}

      {/* polo collar + placket */}
      {isPolo && (
        <>
          <path d="M80 15 L100 37 L120 15 L131 22 L100 49 L69 22 Z"
            fill={colour} stroke={seam} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M94 37 L94 72 L106 72 L106 37" fill="none" stroke={seam} strokeWidth="1.2" />
          <circle cx="100" cy="47" r="1.8" fill={seam} />
          <circle cx="100" cy="62" r="1.8" fill={seam} />
        </>
      )}

      {/* crew neck rib */}
      {!isPolo && !isHoodie && (
        <path d="M76 12 C81 23 89 27 100 27 C111 27 119 23 124 12 L118.5 10 C114 19 108 22 100 22 C92 22 86 19 81.5 10 Z"
          fill={seam} opacity=".9" />
      )}

      {/* sleeve + hem seams */}
      {!isHoodie && (
        <>
          <path d="M35 31 L41 72" stroke={seam} strokeWidth="1.1" fill="none" opacity=".65" />
          <path d="M165 31 L159 72" stroke={seam} strokeWidth="1.1" fill="none" opacity=".65" />
          <path d="M54 145 L146 145" stroke={seam} strokeWidth="1.2" fill="none" />
        </>
      )}

      {/* branding zone */}
      {!allOver && (
        <g>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={z.r}
            fill={zoneFill} stroke={zone} strokeWidth="1.4" strokeDasharray="4 3" />
          {method === "embroidery" ? (
            <g stroke={zone} strokeWidth="1.5" strokeLinecap="round">
              {Array.from({ length: Math.max(3, Math.floor(z.h / 7)) }).map((_, i) => (
                <line key={i} x1={z.x + 5} y1={z.y + 6 + i * 6} x2={z.x + z.w - 5} y2={z.y + 6 + i * 6} />
              ))}
            </g>
          ) : (
            <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 3} textAnchor="middle"
              fontSize={z.w > 40 ? 9 : 7} fontWeight="700" fill={zone} letterSpacing=".5">
              LOGO
            </text>
          )}
        </g>
      )}

      {/* additional print positions */}
      {positions > 1 && !allOver && placement !== "sleeve" && (
        <rect x="40" y={38 + dy} width="18" height="16" rx="2"
          fill={zoneFill} stroke={zone} strokeWidth="1.2" strokeDasharray="3 3" />
      )}
      {positions > 2 && !allOver && (
        <rect x="142" y={38 + dy} width="18" height="16" rx="2"
          fill={zoneFill} stroke={zone} strokeWidth="1.2" strokeDasharray="3 3" />
      )}
    </svg>
  );
}
