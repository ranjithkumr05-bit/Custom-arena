import SystemState from "@/components/SystemState";

export const metadata = { title: "Not permitted", robots: { index: false, follow: false } };

export default function Forbidden() {
  return (
    <SystemState
      code="403 · Not permitted"
      tone="bad"
      title="You don't have access to that"
      body="This area is restricted. If you were looking for your own orders, sign in with the phone number you enquired from — no password needed."
      icon={
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      }
      actions={[
        { label: "My orders", href: "/my-orders", primary: true },
        { label: "Homepage", href: "/" },
      ]}
    />
  );
}
