"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  useAnchored, useDismiss, useFocusTrap, useId, useReducedMotion, useRoving, useScrollLock,
} from "./hooks";

/* ------------------------------------------------------------------ */
/* Portal                                                              */
/* ------------------------------------------------------------------ */

export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

export interface MenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  icon?: ReactNode;
  hint?: string;
  danger?: boolean;
  separatorBefore?: boolean;
}

/**
 * Dropdown menu.
 *
 * Portalled so it escapes any `overflow: hidden` ancestor, anchored with
 * flip/shift, one tab stop with arrow-key navigation, and typeahead — typing
 * "s" jumps to the first item starting with s, which is standard menu
 * behaviour people expect without realising.
 */
export function Menu({
  trigger,
  items,
  header,
  footer,
  align = "end",
  width = 260,
}: {
  trigger: (p: { open: boolean; toggle: () => void; ref: React.RefObject<HTMLButtonElement | null> }) => ReactNode;
  items: MenuItem[];
  header?: ReactNode;
  footer?: ReactNode;
  align?: "start" | "center" | "end";
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const reduced = useReducedMotion();

  const selectable = items.filter((i) => i.href || i.onSelect);
  const { active, setActive, onKeyDown } = useRoving(selectable.length, open);
  const pos = useAnchored(open, triggerRef, panelRef, { align });
  useDismiss(open, () => setOpen(false), [triggerRef, panelRef]);

  // Typeahead
  const buf = useRef({ s: "", t: 0 });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey) return;
      const now = Date.now();
      buf.current.s = now - buf.current.t > 700 ? e.key : buf.current.s + e.key;
      buf.current.t = now;
      const i = selectable.findIndex((it) =>
        it.label.toLowerCase().startsWith(buf.current.s.toLowerCase())
      );
      if (i >= 0) setActive(i);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, selectable, setActive]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.focus();
  }, [open, active]);

  function run(it: MenuItem) {
    setOpen(false);
    it.onSelect?.();
    if (it.href) window.location.href = it.href;
  }

  let si = -1;

  return (
    <>
      {trigger({ open, toggle: () => setOpen((v) => !v), ref: triggerRef })}
      {open && (
        <Portal>
          <div
            ref={panelRef}
            id={id}
            role="menu"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            style={{
              position: "fixed",
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width,
              opacity: pos ? 1 : 0,
              transform: pos ? "none" : "translateY(-4px)",
              transition: reduced ? "none" : "opacity .13s ease, transform .13s cubic-bezier(.2,.8,.3,1)",
            }}
            className="z-[300] overflow-hidden rounded-xl border border-sand-200 bg-white p-1.5 shadow-[0_16px_48px_-12px_rgba(7,21,40,.28)]"
          >
            {header && <div className="border-b border-sand-100 px-3 pb-2.5 pt-1.5">{header}</div>}

            {items.map((it, n) => {
              if (!it.href && !it.onSelect) {
                return (
                  <div key={n} className="px-3 pb-1 pt-2.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
                    {it.label}
                  </div>
                );
              }
              si += 1;
              const i = si;
              return (
                <div key={n}>
                  {it.separatorBefore && <div className="my-1.5 h-px bg-sand-100" />}
                  <button
                    data-i={i}
                    role="menuitem"
                    tabIndex={active === i ? 0 : -1}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => run(it)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition focus:outline-none ${
                      active === i ? "bg-sand-50" : ""
                    } ${it.danger ? "text-[#a6431f]" : "text-navy-800"}`}
                  >
                    {it.icon && <span className="shrink-0 text-ink-400">{it.icon}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{it.label}</span>
                      {it.hint && <span className="block truncate text-[11.5px] text-ink-400">{it.hint}</span>}
                    </span>
                  </button>
                </div>
              );
            })}

            {footer && <div className="mt-1.5 border-t border-sand-100 px-3 pb-1 pt-2.5">{footer}</div>}
          </div>
        </Portal>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const reduced = useReducedMotion();
  useScrollLock(open);
  useFocusTrap(open, panel);
  useDismiss(open, onClose, [panel]);

  if (!open) return null;
  const w = { sm: 400, md: 540, lg: 760 }[size];

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[400] grid place-items-start justify-center overflow-y-auto bg-navy-900/50 p-4 pt-[8vh] backdrop-blur-sm"
        style={{ animation: reduced ? undefined : "ca-fade .16s ease" }}
      >
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-t`}
          aria-describedby={description ? `${id}-d` : undefined}
          tabIndex={-1}
          style={{
            width: "100%",
            maxWidth: w,
            animation: reduced ? undefined : "ca-pop .19s cubic-bezier(.2,.9,.3,1)",
          }}
          className="rounded-2xl border border-sand-200 bg-white shadow-2xl focus:outline-none"
        >
          <div className="flex items-start gap-4 border-b border-sand-100 px-6 py-4">
            <div className="min-w-0 flex-1">
              <h2 id={`${id}-t`} className="text-[18px]">{title}</h2>
              {description && (
                <p id={`${id}-d`} className="mt-1 text-[13.5px] leading-relaxed text-ink-500">{description}</p>
              )}
            </div>
            <button onClick={onClose} aria-label="Close"
              className="-mr-2 grid size-9 shrink-0 place-items-center rounded-md text-ink-400 transition hover:bg-sand-100 hover:text-navy-800">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children && <div className="px-6 py-5">{children}</div>}
          {footer && <div className="flex flex-wrap justify-end gap-2.5 border-t border-sand-100 px-6 py-4">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet — mobile bottom drawer                                        */
/* ------------------------------------------------------------------ */

export function Sheet({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useScrollLock(open);
  useFocusTrap(open, panel);
  useDismiss(open, onClose, [panel]);
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[400] flex items-end bg-navy-900/50 backdrop-blur-sm"
        style={{ animation: reduced ? undefined : "ca-fade .16s ease" }}>
        <div ref={panel} role="dialog" aria-modal="true" tabIndex={-1}
          style={{ animation: reduced ? undefined : "ca-slide-up .24s cubic-bezier(.2,.9,.3,1)" }}
          className="max-h-[86vh] w-full overflow-y-auto rounded-t-2xl bg-white pb-[max(20px,env(safe-area-inset-bottom))] focus:outline-none">
          <div className="sticky top-0 flex items-center gap-3 border-b border-sand-100 bg-white px-5 py-3.5">
            <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-sand-200" />
            <h2 className="flex-1 text-[16px]">{title}</h2>
            <button onClick={onClose} aria-label="Close"
              className="grid size-8 place-items-center rounded-md text-ink-400 hover:bg-sand-100">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const pos = useAnchored(open, trigger, bubble, { align: "center", gap: 6 });
  const id = useId();
  const reduced = useReducedMotion();

  return (
    <>
      <span
        ref={trigger}
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="inline-flex cursor-help rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
      >
        {children}
      </span>
      {open && (
        <Portal>
          <div
            ref={bubble}
            id={id}
            role="tooltip"
            style={{
              position: "fixed",
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              opacity: pos ? 1 : 0,
              transition: reduced ? "none" : "opacity .12s ease",
            }}
            className="z-[500] max-w-[260px] rounded-lg bg-navy-900 px-2.5 py-1.5 text-[12.5px] leading-snug text-white shadow-lg"
          >
            {label}
          </div>
        </Portal>
      )}
    </>
  );
}
