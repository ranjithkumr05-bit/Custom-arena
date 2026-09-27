"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SITE, isPublishable } from "@/lib/content";

/**
 * Sticky bottom action bar for small screens.
 *
 * On a phone the header CTA scrolls away and the floating WhatsApp bubble is
 * the only thing left — so the two actions that matter are pinned instead.
 * Hides itself on the quote page (the form is already the action) and reveals
 * only after the user has scrolled past the hero, so it never covers the
 * opening content.
 */
export default function MobileActionBar() {
  const path = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (path.startsWith("/quote") || path.startsWith("/admin")) return null;

  const phone = SITE.contact.phone;
  const wa = SITE.contact.whatsapp.value;

  return (
    <>
      {/* spacer so the bar never covers the footer's last line */}
      <div aria-hidden className={`lg:hidden ${show ? "h-[68px]" : "h-0"}`} />

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/97 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md transition-transform duration-300 lg:hidden ${
          show ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex gap-2">
          <Link
            href="/quote"
            className="flex min-h-[46px] min-w-0 flex-[1.4] items-center justify-center gap-2 rounded-lg bg-navy-800 text-[14.5px] font-semibold text-white"
          >
            <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            </svg>
            <span className="truncate">Get a quote</span>
          </Link>

          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[46px] min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1faa52] text-[14.5px] font-semibold text-white"
          >
            <svg viewBox="0 0 24 24" className="size-[18px] fill-current" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm4.52 12.15c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28Z" />
            </svg>
            <span className="truncate">WhatsApp</span>
          </a>

          {isPublishable(phone) && (
            <a
              href={`tel:${phone.value}`}
              aria-label="Call us"
              className="grid min-h-[46px] w-[52px] place-items-center rounded-lg border border-sand-200 text-navy-800"
            >
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </>
  );
}
