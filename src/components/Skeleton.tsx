/**
 * Skeleton primitives.
 *
 * Content-aware, not spinners. A spinner says "something is happening"; a
 * skeleton says "this is what is arriving and roughly how much of it", which
 * measurably lowers perceived wait and stops the layout jumping when content
 * lands. Every skeleton below mirrors the real component's box model.
 *
 * The shimmer is a CSS animation that disables itself under
 * prefers-reduced-motion (handled globally in globals.css), leaving a static
 * grey block — still informative, no movement.
 */

export function Sk({ className = "" }: { className?: string }) {
  return <div className={`ca-shimmer rounded-md bg-sand-100 ${className}`} />;
}

/** Announce loading once to assistive tech rather than on every block. */
export function SkRegion({
  label = "Loading",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white">
      <Sk className="aspect-[16/10] rounded-none" />
      <div className="p-[18px]">
        <Sk className="mb-2 h-4 w-2/3" />
        <Sk className="mb-1.5 h-3 w-full" />
        <Sk className="mb-3.5 h-3 w-4/5" />
        <Sk className="h-3 w-24" />
      </div>
    </div>
  );
}

export function SkCardGrid({ n = 8, cols = "lg:grid-cols-4" }: { n?: number; cols?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${cols}`}>
      {Array.from({ length: n }).map((_, i) => (
        <SkCard key={i} />
      ))}
    </div>
  );
}

export function SkHero() {
  return (
    <div className="border-b border-sand-200 bg-navy-900 py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="ca-shimmer mb-3 h-3 w-40 rounded bg-white/10" />
        <div className="ca-shimmer mb-4 h-10 w-3/4 max-w-[560px] rounded bg-white/10" />
        <div className="ca-shimmer mb-2 h-4 w-full max-w-[640px] rounded bg-white/[0.07]" />
        <div className="ca-shimmer h-4 w-2/3 max-w-[480px] rounded bg-white/[0.07]" />
      </div>
    </div>
  );
}

export function SkText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Sk key={i} className={`h-3.5 ${i === lines - 1 ? "w-3/5" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkRows({ n = 6 }: { n?: number }) {
  return (
    <div className="grid gap-2.5">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-sand-200 bg-white px-5 py-4">
          <Sk className="h-4 w-24" />
          <Sk className="h-4 flex-1" />
          <Sk className="hidden h-4 w-20 sm:block" />
          <Sk className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
