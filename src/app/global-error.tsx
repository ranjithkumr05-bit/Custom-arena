"use client";

/**
 * Last resort. The root layout itself failed, so there is no Header, no
 * Footer and no globals.css — this component must replace <html> and <body>
 * and carry its own styling inline. Anything imported here could be the very
 * thing that crashed, so it imports nothing.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#071528",
          color: "#c9d4e4",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <div
            style={{
              width: 56, height: 56, margin: "0 auto 22px",
              display: "grid", placeItems: "center",
              borderRadius: 14, border: "1px solid rgba(200,162,74,.4)",
            }}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#c8a24a" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v5m0 3v.01" />
            </svg>
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: 26, color: "#fff", letterSpacing: "-0.02em" }}>
            The site failed to load
          </h1>
          <p style={{ margin: "0 0 26px", fontSize: 15.5, lineHeight: 1.65, color: "#9fb0c7" }}>
            Something went wrong before the page could start. Reloading usually
            fixes it. If it does not, please message us on WhatsApp and quote
            the reference below.
          </p>
          <button
            onClick={reset}
            style={{
              minHeight: 48, padding: "0 26px", border: 0, borderRadius: 8,
              background: "#c8a24a", color: "#071528",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}
          >
            Reload the page
          </button>
          {error.digest && (
            <p style={{ marginTop: 26, fontSize: 11.5, color: "#7f93ae", fontFamily: "ui-monospace, monospace" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
