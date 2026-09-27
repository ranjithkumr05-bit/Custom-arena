"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useId, useReducedMotion, useRoving } from "./hooks";

/* ------------------------------------------------------------------ */
/* Tabs — roving tabindex, ARIA tablist                                */
/* ------------------------------------------------------------------ */

export function Tabs({
  tabs,
  initial = 0,
}: {
  tabs: { id: string; label: string; badge?: string | number; content: ReactNode }[];
  initial?: number;
}) {
  const [sel, setSel] = useState(initial);
  const { active, setActive, onKeyDown } = useRoving(tabs.length, true, "h");
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [ink, setInk] = useState<{ left: number; width: number } | null>(null);

  // Animated underline that follows the selected tab.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-t="${sel}"]`);
    if (el) setInk({ left: el.offsetLeft, width: el.offsetWidth });
  }, [sel, tabs.length]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-t="${active}"]`)?.focus();
  }, [active]);

  return (
    <div>
      <div ref={listRef} role="tablist" onKeyDown={onKeyDown}
        className="relative flex gap-1 overflow-x-auto border-b border-sand-200">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            data-t={i}
            role="tab"
            id={`${id}-t${i}`}
            aria-selected={sel === i}
            aria-controls={`${id}-p${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => { setSel(i); setActive(i); }}
            onFocus={() => setActive(i)}
            className={`shrink-0 rounded-t-md px-3.5 pb-2.5 pt-2 text-[14px] font-semibold transition focus:outline-none focus-visible:bg-sand-50 ${
              sel === i ? "text-navy-800" : "text-ink-400 hover:text-navy-800"
            }`}
          >
            {t.label}
            {t.badge !== undefined && (
              <span className="ml-1.5 rounded-full bg-sand-100 px-1.5 text-[11px] text-ink-500">{t.badge}</span>
            )}
          </button>
        ))}
        {ink && (
          <span aria-hidden className="absolute bottom-0 h-0.5 rounded-full bg-gold-500 transition-all duration-300 ease-[cubic-bezier(.2,.9,.3,1)]"
            style={{ left: ink.left, width: ink.width }} />
        )}
      </div>

      {tabs.map((t, i) => (
        <div key={t.id} role="tabpanel" id={`${id}-p${i}`} aria-labelledby={`${id}-t${i}`}
          hidden={sel !== i} className="pt-5">
          {sel === i && t.content}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion — animated height, no magic numbers                       */
/* ------------------------------------------------------------------ */

export function Accordion({
  items,
  multiple = false,
}: {
  items: { id: string; title: string; content: ReactNode }[];
  multiple?: boolean;
}) {
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (id: string) =>
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : multiple ? [...o, id] : [id]));

  return (
    <div className="divide-y divide-sand-200 border-y border-sand-200">
      {items.map((it) => (
        <AccordionRow key={it.id} {...it} open={open.includes(it.id)} onToggle={() => toggle(it.id)} />
      ))}
    </div>
  );
}

function AccordionRow({
  title, content, open, onToggle,
}: { title: string; content: ReactNode; open: boolean; onToggle: () => void }) {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  const reduced = useReducedMotion();
  const id = useId();

  // Measure the real content so the transition works at any height, and keep
  // it in sync if the content reflows (responsive, font load).
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.scrollHeight));
    ro.observe(el);
    setH(el.scrollHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      <h3>
        <button
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15.5px] font-semibold text-navy-800"
        >
          {title}
          <span className={`grid size-6 shrink-0 place-items-center rounded-full border border-sand-200 text-gold-500 transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
            <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
      </h3>
      <div
        id={id}
        role="region"
        style={{
          height: open ? h : 0,
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: reduced ? "none" : "height .3s cubic-bezier(.2,.9,.3,1), opacity .22s ease",
        }}
      >
        <div ref={inner} className="pb-4 pr-8 text-[14.5px] leading-relaxed text-ink-500">
          {content}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  options, value, onChange, size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const i = options.findIndex((o) => o.value === value);

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-s="${i}"]`);
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [i, options.length]);

  return (
    <div ref={ref} role="radiogroup"
      className={`relative inline-flex rounded-lg border border-sand-200 bg-sand-50 ${size === "sm" ? "p-0.5" : "p-1"}`}>
      {pill && (
        <span aria-hidden className="absolute rounded-md bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(.2,.9,.3,1)]"
          style={{ left: pill.left, width: pill.width, top: size === "sm" ? 2 : 4, bottom: size === "sm" ? 2 : 4 }} />
      )}
      {options.map((o, n) => (
        <button key={o.value} data-s={n} role="radio" aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 rounded-md font-semibold transition ${
            size === "sm" ? "min-h-[30px] px-2.5 text-[12.5px]" : "min-h-[36px] px-4 text-[13.5px]"
          } ${value === o.value ? "text-navy-800" : "text-ink-400 hover:text-navy-800"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

export function Switch({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-navy-800" : "bg-sand-200"
        }`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-200 ease-[cubic-bezier(.2,.9,.3,1)] ${
          checked ? "left-[22px]" : "left-0.5"
        }`} />
      </button>
      <span className="min-w-0">
        <span id={id} className="block text-[14px] font-semibold text-navy-800">{label}</span>
        {hint && <span className="block text-[12.5px] leading-snug text-ink-500">{hint}</span>}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                             */
/* ------------------------------------------------------------------ */

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-center gap-1">
      {steps.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              aria-current={now ? "step" : undefined}
              className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold transition-colors duration-300 ${
                done ? "bg-navy-800 text-gold-400" : now ? "bg-gold-500 text-navy-900" : "bg-sand-100 text-ink-400"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`hidden truncate text-[12.5px] sm:block ${now ? "font-semibold text-navy-800" : "text-ink-400"}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <span className="h-px flex-1 bg-sand-200">
                <span className="block h-px bg-navy-800 transition-all duration-500" style={{ width: done ? "100%" : "0%" }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar, Spinner, Badge                                              */
/* ------------------------------------------------------------------ */

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  // Deterministic hue from the name, so the same person is always the same colour.
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      aria-hidden
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 34% 30%), hsl(${hue} 40% 20%))`,
      }}
      className="grid shrink-0 place-items-center rounded-full font-bold text-gold-300"
    >
      {initials}
    </span>
  );
}

export function Spinner({ size = 18, label = "Loading" }: { size?: number; label?: string }) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Badge({
  children, tone = "neutral",
}: { children: ReactNode; tone?: "neutral" | "gold" | "good" | "bad" }) {
  const tones = {
    neutral: "bg-sand-100 text-ink-500",
    gold: "bg-gold-50 text-[#8a6d1f]",
    good: "bg-[#e8f6ed] text-[#1a7a43]",
    bad: "bg-[#fdefe9] text-[#a6431f]",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}
