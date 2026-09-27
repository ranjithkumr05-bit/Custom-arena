import Link from "next/link";
import { Wrap } from "./ui";

/**
 * Shared shell for every terminal system state — 404, 500, 503, offline,
 * 429, 403.
 *
 * One component so they cannot drift apart in tone or layout. Each state
 * answers the same three questions in the same order, which is the whole job
 * of an error page:
 *
 *   1. What happened, in plain words
 *   2. Whether it is the user's fault  (almost never — say so)
 *   3. What to do next  (always at least one working action)
 *
 * A dead end with no action is the failure mode to avoid.
 */

export type Tone = "neutral" | "warn" | "bad";

const TONES: Record<Tone, { ring: string; chip: string; icon: string }> = {
  neutral: { ring: "border-sand-200 bg-sand-50", chip: "bg-sand-100 text-ink-500", icon: "text-ink-400" },
  warn: { ring: "border-[#e0b84a] bg-[#fff4d6]", chip: "bg-[#f7e3ab] text-[#7a5a0b]", icon: "text-[#a8842f]" },
  bad: { ring: "border-[#e5b4a2] bg-[#fdefe9]", chip: "bg-[#f7d3c5] text-[#a6431f]", icon: "text-[#a6431f]" },
};

export interface Action {
  href?: string;
  label: string;
  onClick?: () => void;
  primary?: boolean;
}

export default function SystemState({
  code,
  title,
  body,
  tone = "neutral",
  icon,
  actions = [],
  detail,
  children,
}: {
  code?: string;
  title: string;
  body: string;
  tone?: Tone;
  icon?: React.ReactNode;
  actions?: Action[];
  detail?: string;
  children?: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <section className="grid min-h-[62vh] place-items-center py-16">
      <Wrap className="max-w-[620px] text-center">
        <div className={`mx-auto mb-6 grid size-16 place-items-center rounded-2xl border ${t.ring}`}>
          <span className={t.icon}>
            {icon ?? (
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v5m0 3v.01" />
              </svg>
            )}
          </span>
        </div>

        {code && (
          <span className={`mb-3 inline-block rounded-full px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.12em] ${t.chip}`}>
            {code}
          </span>
        )}

        <h1 className="mb-3.5 text-[clamp(24px,3.6vw,34px)]">{title}</h1>
        <p className="mx-auto mb-7 max-w-[480px] text-[16px] leading-relaxed text-ink-500">{body}</p>

        {children}

        {actions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2.5">
            {actions.map((a) => {
              const cls = a.primary
                ? "inline-flex min-h-[48px] items-center rounded-md bg-navy-800 px-6 text-[15px] font-semibold text-white transition hover:bg-navy-700"
                : "inline-flex min-h-[48px] items-center rounded-md border border-sand-200 px-6 text-[15px] font-semibold text-navy-800 transition hover:border-gold-400";
              if (a.href) {
                return <Link key={a.label} href={a.href} className={cls}>{a.label}</Link>;
              }
              return (
                <button key={a.label} onClick={a.onClick} className={cls}>
                  {a.label}
                </button>
              );
            })}
          </div>
        )}

        {detail && (
          <p className="mt-7 border-t border-sand-200 pt-5 font-mono text-[11.5px] leading-relaxed text-ink-400">
            {detail}
          </p>
        )}
      </Wrap>
    </section>
  );
}
