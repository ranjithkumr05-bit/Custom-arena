import SystemState from "@/components/SystemState";

export const metadata = { title: "Too many requests", robots: { index: false, follow: false } };

export default function TooMany() {
  return (
    <SystemState
      code="429 · Rate limited"
      tone="warn"
      title="Slow down for a moment"
      body="We've had a lot of requests from your connection in a short time. This protects the site from abuse — wait a minute and it will clear on its own."
      icon={
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      }
      actions={[
        { label: "Back to homepage", href: "/", primary: true },
        { label: "Message us instead", href: "/contact" },
      ]}
    />
  );
}
