/**
 * Bespoke icon set.
 *
 * The site previously used the same stroke icons every SaaS landing page
 * uses — a shield for "trust", a truck for "delivery", two people for
 * "bulk". A shield means the same nothing on a bank, an insurer and a CRM.
 * None of it said "we make garments".
 *
 * These are drawn for this business: knit loops, yarn cones, a squeegee, an
 * embroidery hoop, a heat press, a size grid. Same 24×24 grid, same 1.7
 * stroke, same round joins, so they read as one family.
 */

type P = { className?: string; size?: number };

function I({ children, className = "", size = 24 }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ---------------- brand motif ---------------- */

/** The knit loop — same geometry as the logo mark. */
export const Stitch = (p: P) => (
  <I {...p}>
    <path d="M3 7c0 6 2 9 4.5 9S12 13 12 7" />
    <path d="M12 7c0 6 2 9 4.5 9S21 13 21 7" />
  </I>
);

/** Rows of loops — used for fabric / knit structure. */
export const KnitRows = (p: P) => (
  <I {...p}>
    <path d="M3 4c0 4 1.3 6 3 6s3-2 3-6" />
    <path d="M9 4c0 4 1.3 6 3 6s3-2 3-6" />
    <path d="M15 4c0 4 1.3 6 3 6s3-2 3-6" />
    <path d="M3 14c0 4 1.3 6 3 6s3-2 3-6" opacity=".55" />
    <path d="M9 14c0 4 1.3 6 3 6s3-2 3-6" opacity=".55" />
    <path d="M15 14c0 4 1.3 6 3 6s3-2 3-6" opacity=".55" />
  </I>
);

/* ---------------- garments ---------------- */

export const Tee = (p: P) => (
  <I {...p}>
    <path d="M9 3 6.5 3.8 3 6l1.2 4 2.1-.7V21h11.4V9.3l2.1.7L21 6l-3.5-2.2L15 3a3 3 0 0 1-6 0Z" />
  </I>
);

export const Polo = (p: P) => (
  <I {...p}>
    <path d="M9 3 6.5 3.8 3 6l1.2 4 2.1-.7V21h11.4V9.3l2.1.7L21 6l-3.5-2.2L15 3" />
    <path d="M9 3l3 3.4L15 3" />
    <path d="M10.6 6.8V11h2.8V6.8" />
  </I>
);

export const Hoodie = (p: P) => (
  <I {...p}>
    <path d="M8.6 5.2 6 6 3 8.2l1.3 4.2 2-.7V21h11.4v-9.3l2 .7L21 8.2 18 6l-2.6-.8" />
    <path d="M8.6 5.2A3.4 3.4 0 0 1 12 2a3.4 3.4 0 0 1 3.4 3.2c-.8 1.6-2 2.3-3.4 2.3s-2.6-.7-3.4-2.3Z" />
    <path d="M10 7.6v1.2M14 7.6v1.2" />
  </I>
);

/** Sleeveless jersey with a number panel. */
export const Jersey = (p: P) => (
  <I {...p}>
    <path d="M9 3 5 4.6 4 9l2.4.5V21h11.2V9.5L20 9l-1-4.4L15 3a3 3 0 0 1-6 0Z" />
    <path d="M10 13h4M12 13v4" />
  </I>
);

/* ---------------- process ---------------- */

/** Yarn cone — fabric sourcing. */
export const YarnCone = (p: P) => (
  <I {...p}>
    <path d="M9 3h6l2.5 15H6.5L9 3Z" />
    <path d="M8.2 8h7.6M7.7 13h8.6" opacity=".6" />
    <path d="M4.5 21h15" />
  </I>
);

/** Shears over a cut line. */
export const Cutting = (p: P) => (
  <I {...p}>
    <circle cx="5.5" cy="18" r="2.2" />
    <circle cx="5.5" cy="6" r="2.2" />
    <path d="M7.4 16.9 19 5.5M7.4 7.1 19 18.5" />
    <path d="M2 12h20" strokeDasharray="2 2.4" opacity=".55" />
  </I>
);

/** Squeegee across a screen — screen printing. */
export const Squeegee = (p: P) => (
  <I {...p}>
    <rect x="2.5" y="4" width="19" height="12.5" rx="1.6" />
    <path d="M5.5 13.5h13" strokeWidth="2.6" />
    <path d="M12 13.5V21" />
    <path d="M9 21h6" />
  </I>
);

/** Hoop with needle and thread — embroidery. */
export const Hoop = (p: P) => (
  <I {...p}>
    <circle cx="11" cy="13" r="7.5" />
    <circle cx="11" cy="13" r="4.6" opacity=".5" />
    <path d="M18.5 5.5 21.5 2.5" />
    <path d="m16.4 7.6 2.1-2.1 1.4 1.4-2.1 2.1z" />
  </I>
);

/** Heat press — sublimation. */
export const HeatPress = (p: P) => (
  <I {...p}>
    <rect x="3" y="4" width="18" height="4.5" rx="1.4" />
    <path d="M12 8.5v3" />
    <rect x="4.5" y="15.5" width="15" height="5" rx="1.4" />
    <path d="M9 13.2c0-1 1-1.4 1-2.4M12 13.2c0-1 1-1.4 1-2.4M15 13.2c0-1 1-1.4 1-2.4" opacity=".6" />
  </I>
);

/** Needle and thread — stitching. */
export const Needle = (p: P) => (
  <I {...p}>
    <path d="M20.5 3.5 9 15" />
    <path d="M18.8 2.2a1.8 1.8 0 0 1 2.9 2.2" />
    <path d="M9 15l-1.6 3.6L11 17" />
    <path d="M6.5 21c-2-1.4-2-4 0-5.4s4.6-.6 4.6-3" strokeDasharray="1.8 2" opacity=".65" />
  </I>
);

/** Tape measure — checking. */
export const Tape = (p: P) => (
  <I {...p}>
    <path d="M3 9.5h18a0 0 0 0 1 0 0v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
    <path d="M6 9.5V12M9 9.5v3.4M12 9.5V12M15 9.5v3.4M18 9.5V12" />
    <path d="M6.5 6.5h11" />
    <path d="M8.5 4.5 6.5 6.5l2 2M15.5 4.5l2 2-2 2" />
  </I>
);

/** Carton — packing and dispatch. */
export const Carton = (p: P) => (
  <I {...p}>
    <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" />
    <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
    <path d="M8.5 5.2 17 9.6" opacity=".55" />
  </I>
);

/* ---------------- commercial ---------------- */

/** A short stack of folded pieces — minimum order. */
export const Pieces = (p: P) => (
  <I {...p}>
    <path d="M4 16.5 12 20l8-3.5" />
    <path d="M4 12.5 12 16l8-3.5" />
    <path d="M4 8.5 12 12l8-3.5L12 5 4 8.5Z" />
  </I>
);

/** Arrow going straight through, no middle stop — buying direct. */
export const Direct = (p: P) => (
  <I {...p}>
    <path d="M3 12h12" />
    <path d="m12 8 4 4-4 4" />
    <circle cx="20" cy="12" r="1.6" />
    <path d="M9.5 4.5 7 7M9.5 19.5 7 17" opacity=".45" strokeDasharray="1.5 2" />
  </I>
);

/** Roof over the whole line — everything in-house. */
export const OneRoof = (p: P) => (
  <I {...p}>
    <path d="M2.5 10 12 3.5 21.5 10" />
    <path d="M4.5 9v10.5h15V9" />
    <path d="M8 19.5v-5h3v5M13.5 14.5h3v5" opacity=".7" />
  </I>
);

/** Woven neck label — private label. */
export const Label = (p: P) => (
  <I {...p}>
    <path d="M4 5h16v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5Z" />
    <path d="M4 5c2.4 2 5 3 8 3s5.6-1 8-3" />
    <path d="M9 19.5h6" opacity=".6" />
    <path d="M8.5 11h7" opacity=".6" />
  </I>
);

/** Seven-cell grid — the size breakdown. */
export const SizeGrid = (p: P) => (
  <I {...p}>
    <rect x="2.5" y="8" width="19" height="8" rx="1.4" />
    <path d="M7.2 8v8M12 8v8M16.8 8v8" />
    <path d="M5 5.5h14" opacity=".5" />
  </I>
);

/** Fabric swatch with a folded corner. */
export const Swatch = (p: P) => (
  <I {...p}>
    <path d="M4 4h11l5 5v11H4V4Z" />
    <path d="M15 4v5h5" />
    <path d="M7 12.5h8M7 16h5" opacity=".6" />
  </I>
);

/** Speech bubble with a knit loop inside — talk to the unit. */
export const TalkToUs = (p: P) => (
  <I {...p}>
    <path d="M21 11.5a8 8 0 0 1-8.5 8 8.6 8.6 0 0 1-3.8-.9L3 20.5l1.6-4.8A8.1 8.1 0 0 1 3.5 11 8 8 0 0 1 12 3.5a8 8 0 0 1 9 8Z" />
    <path d="M8.5 9.5c0 3 .9 4.3 2 4.3s2-1.3 2-4.3" opacity=".75" />
    <path d="M12.5 9.5c0 3 .9 4.3 2 4.3s2-1.3 2-4.3" opacity=".75" />
  </I>
);

/* ---------------- lookup ---------------- */

export const PROCESS_ICONS: Record<string, (p: P) => React.ReactElement> = {
  "fabric-sourcing": YarnCone,
  cutting: Cutting,
  branding: Squeegee,
  stitching: Needle,
  "checking-ironing": Tape,
  "packing-dispatch": Carton,
};

export const METHOD_ICONS: Record<string, (p: P) => React.ReactElement> = {
  screen: Squeegee,
  dtf: HeatPress,
  dtg: HeatPress,
  embroidery: Hoop,
  sublimation: HeatPress,
};
