"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { captureAttribution } from "@/lib/marketing";

/**
 * Analytics loader.
 *
 * Principles:
 *  - Nothing loads unless its env var is set. An unconfigured site ships zero
 *    third-party JavaScript, so the default state is fast and private.
 *  - Marketing tags wait for consent. Attribution capture does not — it is
 *    first-party, stays on the device until the user submits a form, and is
 *    the thing that makes their own enquiry traceable.
 *  - Google Consent Mode v2 defaults are set BEFORE gtag loads, otherwise the
 *    denied state never applies to the first pageview.
 *  - `afterInteractive`, never `beforeInteractive` — no tag is worth blocking
 *    the quote builder on.
 */

const GA = process.env.NEXT_PUBLIC_GA_ID;
const GTM = process.env.NEXT_PUBLIC_GTM_ID;
const META = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CLARITY = process.env.NEXT_PUBLIC_CLARITY_ID;

const CONSENT_KEY = "ca_consent";

export function hasConsent() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "granted";
}

/** Fire a conversion event to whichever tags are present. */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...a: unknown[]) => void;
    fbq?: (...a: unknown[]) => void;
    dataLayer?: unknown[];
    clarity?: (...a: unknown[]) => void;
  };
  w.gtag?.("event", event, params);
  w.dataLayer?.push({ event, ...params });
  if (event === "generate_lead") w.fbq?.("track", "Lead", params);
  if (event === "begin_checkout") w.fbq?.("track", "InitiateCheckout", params);
  w.clarity?.("event", event);
}

export default function Analytics() {
  const path = usePathname();
  const [consent, setConsent] = useState(false);
  const [asked, setAsked] = useState(true);

  useEffect(() => {
    const v = localStorage.getItem(CONSENT_KEY);
    setConsent(v === "granted");
    setAsked(v !== null);
  }, []);

  // First-party attribution — runs regardless of tag consent.
  useEffect(() => { captureAttribution(); }, [path]);

  // SPA pageviews
  useEffect(() => {
    if (!consent) return;
    track("page_view", { page_path: path });
  }, [path, consent]);

  function decide(granted: boolean) {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    setConsent(granted);
    setAsked(true);
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.("consent", "update", {
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
      analytics_storage: granted ? "granted" : "denied",
    });
  }

  const anyTag = GA || GTM || META || CLARITY;

  return (
    <>
      {/* Consent Mode v2 defaults must exist before gtag initialises. */}
      {anyTag && (
        <Script id="ca-consent-default" strategy="afterInteractive">{`
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          window.gtag=window.gtag||gtag;
          gtag('consent','default',{
            ad_storage:'denied', ad_user_data:'denied',
            ad_personalization:'denied', analytics_storage:'denied',
            wait_for_update: 500
          });
        `}</Script>
      )}

      {GA && consent && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ca-ga" strategy="afterInteractive">{`
            gtag('js', new Date());
            gtag('config', '${GA}', { send_page_view: true });
          `}</Script>
        </>
      )}

      {GTM && consent && (
        <Script id="ca-gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM}');
        `}</Script>
      )}

      {META && consent && (
        <Script id="ca-meta" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${META}');fbq('track','PageView');
        `}</Script>
      )}

      {/* Clarity is heatmaps and session replay, not advertising — but it
          still records behaviour, so it waits for consent like the rest. */}
      {CLARITY && consent && (
        <Script id="ca-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','${CLARITY}');
        `}</Script>
      )}

      {anyTag && !asked && <ConsentBanner onDecide={decide} />}
    </>
  );
}

function ConsentBanner({ onDecide }: { onDecide: (v: boolean) => void }) {
  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-3 bottom-3 z-[550] mx-auto max-w-[520px] rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_20px_50px_-12px_rgba(7,21,40,.35)]"
    >
      <h2 className="mb-1.5 text-[15px]">Measurement cookies</h2>
      <p className="mb-4 text-[13.5px] leading-relaxed text-ink-500">
        We would like to measure which pages and campaigns lead to enquiries.
        Decline and the site works exactly the same — nothing here is behind a
        cookie wall.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onDecide(true)}
          className="min-h-[42px] flex-1 rounded-md bg-navy-800 px-4 text-[14px] font-semibold text-white transition hover:bg-navy-700"
        >
          Allow
        </button>
        <button
          onClick={() => onDecide(false)}
          className="min-h-[42px] flex-1 rounded-md border border-sand-200 px-4 text-[14px] font-semibold text-navy-800 transition hover:border-ink-400"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
