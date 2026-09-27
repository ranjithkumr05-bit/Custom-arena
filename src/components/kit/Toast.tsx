"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Portal } from "./overlays";
import { useReducedMotion } from "./hooks";

/**
 * Toast queue.
 *
 * Three behaviours that separate a usable toast system from a decorative one:
 *
 *  - The timer pauses on hover and on focus. A toast that vanishes while you
 *    are reaching for its "Undo" button is worse than no toast.
 *  - Errors never auto-dismiss. If something failed, the user decides when
 *    they have finished reading it.
 *  - The live region is polite for success and assertive for errors, so a
 *    screen reader is not interrupted by a confirmation but is by a failure.
 */

type Tone = "info" | "success" | "error";

interface Toast {
  id: number;
  tone: Tone;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
  duration: number;
}

interface Api {
  show: (t: Omit<Toast, "id" | "duration"> & { duration?: number }) => number;
  success: (title: string, body?: string) => number;
  error: (title: string, body?: string) => number;
  dismiss: (id: number) => void;
}

const Ctx = createContext<Api | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let seq = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback<Api["show"]>((t) => {
    const id = seq++;
    setToasts((prev) => [
      // Cap the stack — more than three at once is noise.
      ...prev.slice(-2),
      { id, duration: t.tone === "error" ? 0 : (t.duration ?? 4500), ...t },
    ]);
    return id;
  }, []);

  const api = useMemo<Api>(
    () => ({
      show,
      dismiss,
      success: (title, body) => show({ tone: "success", title, body }),
      error: (title, body) => show({ tone: "error", title, body }),
    }),
    [show, dismiss]
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <Portal>
        <div
          /* Lifted clear of MobileActionBar (68px + safe-area) on small screens,
             otherwise a toast lands on top of the Get-a-quote button. */
          className="pointer-events-none fixed right-4 z-[600] flex w-[calc(100vw-32px)] max-w-[380px] flex-col gap-2.5 bottom-[calc(80px+env(safe-area-inset-bottom))] lg:bottom-4"
          aria-live="polite"
        >
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>
      </Portal>
    </Ctx.Provider>
  );
}

const TONES: Record<Tone, { ring: string; icon: React.ReactNode; bar: string }> = {
  info: {
    ring: "border-sand-200",
    bar: "bg-navy-600",
    icon: <circle cx="12" cy="12" r="9" />,
  },
  success: {
    ring: "border-[#bce3cc]",
    bar: "bg-[#1a7a43]",
    icon: <path d="M20 6 9 17l-5-5" />,
  },
  error: {
    ring: "border-[#e5b4a2]",
    bar: "bg-[#a6431f]",
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5m0 3v.01" /></>,
  },
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const [left, setLeft] = useState(100);
  const start = useRef(Date.now());
  const elapsed = useRef(0);
  const reduced = useReducedMotion();
  const t = TONES[toast.tone];

  useEffect(() => {
    if (!toast.duration) return;
    if (paused) {
      elapsed.current += Date.now() - start.current;
      return;
    }
    start.current = Date.now();
    const tick = setInterval(() => {
      const done = elapsed.current + (Date.now() - start.current);
      const pct = Math.max(0, 100 - (done / toast.duration) * 100);
      setLeft(pct);
      if (pct <= 0) onDismiss();
    }, 60);
    return () => clearInterval(tick);
  }, [paused, toast.duration, onDismiss]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      aria-live={toast.tone === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      style={{ animation: reduced ? undefined : "ca-toast-in .26s cubic-bezier(.2,.9,.3,1)" }}
      className={`pointer-events-auto overflow-hidden rounded-xl border bg-white shadow-[0_12px_36px_-10px_rgba(7,21,40,.3)] ${t.ring}`}
    >
      <div className="flex gap-3 p-3.5">
        <svg viewBox="0 0 24 24" className={`mt-0.5 size-[18px] shrink-0 ${
          toast.tone === "success" ? "text-[#1a7a43]" : toast.tone === "error" ? "text-[#a6431f]" : "text-navy-600"
        }`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {t.icon}
        </svg>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-navy-800">{toast.title}</p>
          {toast.body && <p className="mt-0.5 text-[13px] leading-snug text-ink-500">{toast.body}</p>}
          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); onDismiss(); }}
              className="mt-2 text-[13px] font-semibold text-navy-800 underline decoration-gold-500 underline-offset-4"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button onClick={onDismiss} aria-label="Dismiss"
          className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-md text-ink-400 transition hover:bg-sand-100 hover:text-navy-800">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {toast.duration > 0 && (
        <div className="h-0.5 bg-sand-100">
          <div className={`h-full ${t.bar} ${paused ? "opacity-40" : ""}`}
            style={{ width: `${left}%`, transition: "width .06s linear" }} />
        </div>
      )}
    </div>
  );
}
