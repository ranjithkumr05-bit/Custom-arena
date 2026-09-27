import Link from "next/link";

/**
 * Empty state — the ninth system state, and the one most often skipped.
 *
 * "No results" on its own is a dead end. Every empty state here names why it
 * is empty and offers the next useful action.
 */
export default function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-sand-200 bg-sand-50 px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-white text-ink-400">
        {icon ?? (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 15h5" />
          </svg>
        )}
      </div>
      <h3 className="mb-1.5 text-[18px]">{title}</h3>
      <p className="mx-auto mb-5 max-w-[380px] text-[14.5px] leading-relaxed text-ink-500">{body}</p>
      {action && (
        <Link href={action.href}
          className="inline-flex min-h-[44px] items-center rounded-md bg-navy-800 px-5 text-[14.5px] font-semibold text-white transition hover:bg-navy-700">
          {action.label}
        </Link>
      )}
    </div>
  );
}
