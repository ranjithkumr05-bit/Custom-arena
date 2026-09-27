import SystemState from "@/components/SystemState";

export const metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <SystemState
      code="404 · Not found"
      title="That page doesn't exist"
      body="The link may be out of date, or the page may have been renamed. Everything we make is still one click away."
      icon={
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
      }
      actions={[
        { label: "What we make", href: "/what-we-make", primary: true },
        { label: "Get a quote", href: "/quote" },
        { label: "Homepage", href: "/" },
      ]}
    >
      <p className="mb-7 text-[14px] text-ink-400">
        Tip: press <kbd className="rounded border border-sand-200 bg-sand-50 px-1.5 py-0.5 font-sans text-[12px]">⌘K</kbd> anywhere to search the site.
      </p>
    </SystemState>
  );
}
