/**
 * Background motif — the same knit loop as the logo mark, tiled.
 *
 * An SVG pattern rather than an image: a few hundred bytes, resolution
 * independent, and it inherits colour. Gives dark sections texture without
 * the muddy "dark photo at 20% opacity" look every competitor uses.
 */
export default function KnitPattern({
  className = "",
  opacity = 0.07,
  scale = 46,
}: {
  className?: string;
  opacity?: number;
  scale?: number;
}) {
  return (
    <svg aria-hidden className={`pointer-events-none absolute inset-0 size-full ${className}`}>
      <defs>
        <pattern id="knit" width={scale} height={scale * 0.62} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={opacity}>
            <path d={`M0 ${scale * 0.1} C0 ${scale * 0.42} ${scale * 0.14} ${scale * 0.52} ${scale * 0.25} ${scale * 0.52} C${scale * 0.36} ${scale * 0.52} ${scale * 0.5} ${scale * 0.42} ${scale * 0.5} ${scale * 0.1}`} />
            <path d={`M${scale * 0.5} ${scale * 0.1} C${scale * 0.5} ${scale * 0.42} ${scale * 0.64} ${scale * 0.52} ${scale * 0.75} ${scale * 0.52} C${scale * 0.86} ${scale * 0.52} ${scale} ${scale * 0.42} ${scale} ${scale * 0.1}`} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#knit)" />
    </svg>
  );
}
