"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export interface RotatorItem {
  slug: string;
  title: string;
  hero: string;
  heroAlt: string;
  count: number;
}

/**
 * Rotating category showcase.
 *
 * Now driven by Motion (the successor to framer-motion) rather than CSS
 * transitions. The gain is real: AnimatePresence keeps the outgoing slide
 * mounted while it fades, so image and caption cross-dissolve against each
 * other instead of the new one popping in over a gap. Spring physics on the
 * caption also read as weighted rather than linear.
 *
 * Behaviour retained from the hand-rolled version:
 *  - pauses on hover AND keyboard focus
 *  - pauses when the tab is hidden, so it is not mid-cycle on return
 *  - `useReducedMotion` kills auto-advance entirely; dots stay as controls
 */
const INTERVAL = 4200;

export default function HeroRotator({ items }: { items: RotatorItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (n: number) => setI(((n % items.length) + items.length) % items.length),
    [items.length]
  );

  useEffect(() => {
    if (reduced || paused || items.length < 2) return;
    timer.current = setInterval(() => setI((p) => (p + 1) % items.length), INTERVAL);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [reduced, paused, items.length]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const cur = items[i];

  return (
    <div
      className="relative mx-auto w-full max-w-[460px] max-w-full lg:max-w-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative aspect-[4/3] max-w-full overflow-hidden rounded-[22px] shadow-[0_44px_88px_-32px_rgba(0,0,0,.85)] ring-1 ring-white/12 sm:aspect-[5/4]">
        <AnimatePresence initial={false}>
          <motion.div
            key={cur.slug}
            className="absolute inset-0"
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              opacity: { duration: reduced ? 0 : 0.8, ease: [0.4, 0, 0.2, 1] },
              scale: { duration: reduced ? 0 : 6, ease: "linear" },
            }}
          >
            <Link href={`/what-we-make/${cur.slug}`} className="absolute inset-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500">
              <Image
                src={cur.hero}
                alt={cur.heroAlt}
                fill
                priority
                sizes="(max-width:1024px) 92vw, 520px"
                className="object-cover"
              />
              <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,15,30,.94)_0%,rgba(5,15,30,.35)_44%,transparent_72%)]" />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* caption — the only overlay. The "N TYPES" chip and the floating
            "10 PIECE MIN" badge were removed: the MOQ is already stated in
            the hero paragraph two inches away, and the type count is detail
            that belongs on the category page, not over a photograph. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={cur.slug}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[26px]"
            >
              {cur.title}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* controls */}
      <div className="mt-1 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Product categories">
          {items.map((it, n) => (
            <button
              key={it.slug}
              role="tab"
              aria-selected={n === i}
              aria-label={it.title}
              onClick={() => go(n)}
              className="group flex h-11 flex-1 items-center focus:outline-none"
            >
              {/* 44px hit area, 4px visual. Tapping a 4px bar on glass is a
                  coin toss; the bar itself stays thin. */}
              <span className="block h-1 w-full overflow-hidden rounded-full bg-white/15 transition group-hover:bg-white/25 group-focus-visible:ring-2 group-focus-visible:ring-gold-500">
              <motion.span
                className="block h-full rounded-full bg-gold-500"
                initial={false}
                animate={{ width: n === i ? "100%" : "0%" }}
                transition={
                  n === i && !reduced && !paused
                    ? { duration: INTERVAL / 1000, ease: "linear" }
                    : { duration: 0.25 }
                }
              />
              </span>
            </button>
          ))}
        </div>
        <span className="shrink-0 text-[11.5px] tabular-nums text-[#7f93ae]">
          {i + 1}/{items.length}
        </span>
      </div>
    </div>
  );
}
