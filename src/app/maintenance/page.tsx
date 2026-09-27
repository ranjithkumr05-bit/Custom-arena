import SystemState from "@/components/SystemState";
import { SITE } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Back shortly",
  robots: { index: false, follow: false },
};

/**
 * Served with HTTP 503 + Retry-After by the middleware, so search engines
 * treat it as temporary and do not drop the indexed pages. A maintenance page
 * returning 200 is how sites lose rankings during a deploy.
 */
export default function Maintenance() {
  const until = process.env.MAINTENANCE_UNTIL;
  const wa = SITE.contact.whatsapp.value;
  return (
    <SystemState
      code="503 · Scheduled maintenance"
      tone="warn"
      title="We're making some updates"
      body={
        until
          ? `The site is briefly offline for planned work. We expect to be back by ${until}.`
          : "The site is briefly offline for planned work and will be back shortly. Enquiries by WhatsApp are unaffected."
      }
      icon={
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a4 4 0 0 1-5 5L4 17v3h3l5.7-5.7a4 4 0 0 1 5-5l2.6-2.6-2.6-2.6Z" />
        </svg>
      }
      actions={[{ label: "Message us on WhatsApp", href: `https://wa.me/${wa}`, primary: true }]}
      detail="Your enquiries and order references are unaffected by this work."
    />
  );
}
