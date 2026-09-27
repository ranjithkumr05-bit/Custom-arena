"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/** Honour the OS motion preference, reactively. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return reduced;
}

/**
 * Close on outside pointer-down or Escape.
 *
 * pointerdown rather than click: a click fires after mouseup, so a user who
 * presses inside and releases outside (text selection) would close the layer
 * unexpectedly. Escape is captured at the window so it works even when focus
 * has moved into a nested control.
 */
export function useDismiss(
  open: boolean,
  onClose: () => void,
  refs: React.RefObject<HTMLElement | null>[]
) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (refs.some((r) => r.current?.contains(t))) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose, refs]);
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Trap focus inside a layer and restore it on close.
 *
 * Restoring focus is the half people skip. Without it a keyboard user is
 * dumped at the top of the document every time they close a dialog.
 */
export function useFocusTrap(open: boolean, ref: React.RefObject<HTMLElement | null>) {
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement;

    const node = ref.current;
    const first = node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreTo.current?.focus?.();
    };
  }, [open, ref]);
}

/** Lock body scroll without the layout shifting as the scrollbar disappears. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [active]);
}

/**
 * Roving tabindex.
 *
 * A composite widget should be ONE tab stop, with arrow keys moving inside
 * it. Menus and tab lists that leave every child tabbable make a keyboard
 * user press Tab a dozen times to get past them.
 */
export function useRoving(count: number, open = true, orientation: "v" | "h" = "v") {
  const [active, setActive] = useState(0);
  useEffect(() => { if (open) setActive(0); }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const next = orientation === "v" ? "ArrowDown" : "ArrowRight";
      const prev = orientation === "v" ? "ArrowUp" : "ArrowLeft";
      if (e.key === next) { e.preventDefault(); setActive((i) => (i + 1) % count); }
      else if (e.key === prev) { e.preventDefault(); setActive((i) => (i - 1 + count) % count); }
      else if (e.key === "Home") { e.preventDefault(); setActive(0); }
      else if (e.key === "End") { e.preventDefault(); setActive(count - 1); }
    },
    [count, orientation]
  );

  return { active, setActive, onKeyDown };
}

/**
 * Anchor a floating layer to a trigger, flipping and shifting to stay on
 * screen. A tiny subset of what Floating UI does, without the dependency.
 */
export function useAnchored(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  floatRef: React.RefObject<HTMLElement | null>,
  { align = "end", gap = 8 }: { align?: "start" | "center" | "end"; gap?: number } = {}
) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) { setPos(null); return; }
    let raf = 0;
    let tries = 0;

    const place = () => {
      const t = triggerRef.current?.getBoundingClientRect();
      const f = floatRef.current?.getBoundingClientRect();

      // <Portal> mounts on its own effect, so the floating node can be absent
      // on the first pass. Retry on the next frame rather than giving up —
      // that silent bail left every menu invisible at -9999.
      if (!t || !f || f.width === 0) {
        if (tries++ < 20) raf = requestAnimationFrame(place);
        return;
      }

      let top = t.bottom + gap;
      if (top + f.height > window.innerHeight - 8 && t.top - gap - f.height > 8) {
        top = t.top - gap - f.height; // flip above
      }

      let left =
        align === "start" ? t.left
        : align === "center" ? t.left + t.width / 2 - f.width / 2
        : t.right - f.width;
      left = Math.min(Math.max(8, left), window.innerWidth - f.width - 8); // shift into view

      setPos({ top, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, triggerRef, floatRef, align, gap]);

  return pos;
}

export { useId };
