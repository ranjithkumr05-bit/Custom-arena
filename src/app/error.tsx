"use client";

import { useEffect } from "react";
import SystemState from "@/components/SystemState";

/**
 * Recoverable route error. Next catches the throw, keeps the shell mounted
 * and hands us `reset()` to retry the segment without a full reload.
 *
 * `error.digest` is a server-generated hash of the real error. The message
 * itself is deliberately withheld from the browser in production — showing it
 * would leak internals. The digest is what correlates this screen with the
 * server log, so it is surfaced for the user to quote.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
    // Hook a real reporter in here: Sentry.captureException(error)
  }, [error]);

  return (
    <SystemState
      code="500 · Server error"
      tone="bad"
      title="Something broke on our side"
      body="This is our fault, not yours. Nothing you entered has been lost — try again, and if it keeps happening tell us the code below."
      icon={
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4m0 3.5v.01" />
        </svg>
      }
      actions={[
        { label: "Try again", onClick: reset, primary: true },
        { label: "Go to homepage", href: "/" },
        { label: "Contact us", href: "/contact" },
      ]}
      detail={error.digest ? `Reference: ${error.digest}` : undefined}
    />
  );
}
