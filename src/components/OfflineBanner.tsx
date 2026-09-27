"use client";

import { useEffect, useState } from "react";

/**
 * Connection state.
 *
 * `navigator.onLine` alone is unreliable — it reports true for a device
 * connected to a router with no internet behind it. A cheap same-origin HEAD
 * confirms reachability before we claim the user is offline.
 *
 * Shown as a banner rather than a full-page takeover: the page they are on is
 * already rendered and still readable, so replacing it would remove working
 * content to tell them something is broken.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;

    async function probe() {
      if (!navigator.onLine) { if (alive) setOffline(true); return; }
      try {
        await fetch("/favicon.ico", { method: "HEAD", cache: "no-store" });
        if (alive) setOffline(false);
      } catch {
        if (alive) setOffline(true);
      }
    }

    const onDown = () => setOffline(true);
    window.addEventListener("offline", onDown);
    window.addEventListener("online", probe);
    const id = setInterval(() => { if (offline) probe(); }, 8000);

    return () => {
      alive = false;
      window.removeEventListener("offline", onDown);
      window.removeEventListener("online", probe);
      clearInterval(id);
    };
  }, [offline]);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-x-0 top-0 z-[200] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#a6431f] px-4 py-2.5 text-center text-[13.5px] font-medium text-white"
    >
      <span className="inline-flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 13a10 10 0 0 1 3-2M2 8.8A15 15 0 0 1 6 6.4m5-1.3a15 15 0 0 1 11 3.7M19 13a10 10 0 0 0-2.3-1.6M12 20h.01" />
        </svg>
        You are offline. This page is still readable, but forms will not send.
      </span>
      <button
        onClick={() => location.reload()}
        className="rounded border border-white/40 px-2.5 py-0.5 text-[12.5px] font-semibold hover:bg-white/10"
      >
        Retry
      </button>
    </div>
  );
}
