"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

// Replaces the root layout when a top-level error occurs — must define html/body.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logger.error(`GLOBAL render error: ${error.message}`, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#f7f9fb",
          color: "#0f1722",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, border: "1px solid #dce3ec", borderRadius: 8, background: "#fff" }}>
          <h1 style={{ fontSize: 16, color: "#c5302a", margin: 0 }}>Sentinx failed to load</h1>
          <p style={{ fontSize: 13, color: "#586273" }}>A top-level error occurred (logged to console + server).</p>
          <pre style={{ fontSize: 12, background: "#eef2f6", padding: 12, borderRadius: 4, overflow: "auto" }}>
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
          <button
            onClick={() => unstable_retry()}
            style={{ height: 36, padding: "0 16px", background: "#1d5bd6", color: "#fff", border: 0, borderRadius: 5, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
