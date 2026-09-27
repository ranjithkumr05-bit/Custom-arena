"use client";

import { usePathname } from "next/navigation";
import Header, { type NavCat } from "./Header";
import Footer from "./Footer";
import WhatsAppFab from "./WhatsAppFab";
import MobileActionBar from "./MobileActionBar";
import BackBar from "./BackBar";
import OfflineBanner from "./OfflineBanner";
import { ToastProvider } from "./kit/Toast";
import Analytics from "./Analytics";

/**
 * Site chrome wrapper.
 *
 * /admin is an internal tool, not a marketing page — it gets the full viewport
 * with its own top bar instead of the public header, footer, WhatsApp bubble
 * and mobile action bar.
 */
export default function Chrome({ children, nav }: { children: React.ReactNode; nav: NavCat[] }) {
  const path = usePathname();
  const bare = path.startsWith("/admin");

  if (bare) return <ToastProvider><Analytics /><OfflineBanner />{children}</ToastProvider>;

  return (
    <ToastProvider>
      <Analytics />
      <OfflineBanner />
      <div className="bg-navy-900 px-4 py-2 text-center text-[12px] leading-snug text-gold-300 sm:py-2.5 sm:text-[13px]">
        <span className="sm:hidden">Preview build — amber markers await your real data.</span>
        <span className="hidden sm:inline">
          Preview build — amber markers show values awaiting your real data.
          Nothing here is a published claim.
        </span>
      </div>
      <Header nav={nav} />
      <BackBar />
      <main>{children}</main>
      <Footer />
      <WhatsAppFab />
      <MobileActionBar />
    </ToastProvider>
  );
}
