import Image from "next/image";

/**
 * Brand mark.
 *
 * The supplied artwork is a raster badge with the navy field baked in, so
 * the navy OUTSIDE the circle was masked away while the navy inside the
 * rings — which is part of the design — was kept. That lets the same file
 * sit on white, sand or navy without a visible box behind it.
 *
 * Note for later: this is a PNG. For print, signage or very large display
 * you will want the original vector from whoever drew it.
 */
export function Mark({ size = 38, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/customwear-badge-512.png"
      alt=""
      width={size}
      height={size}
      priority
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export const MarkLight = Mark;

export default function Logo({ light = false, size = 38 }: { light?: boolean; size?: number }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Mark size={size} />
      <span className="hidden min-w-0 leading-tight sm:block">
        <b className={`block whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] ${light ? "text-white" : "text-navy-800"}`}>
          CustomWear
        </b>
        <span className={`block whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.16em] ${light ? "text-[#7f93ae]" : "text-ink-400"}`}>
          Tiruppur · Knitwear
        </span>
      </span>
    </span>
  );
}
