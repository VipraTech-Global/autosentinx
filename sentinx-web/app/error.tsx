"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logger.error(`render error: ${error.message}`, {
      digest: error.digest,
      stack: error.stack?.split("\n").slice(0, 4).join(" | "),
    });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-md border border-fail/40 bg-surface p-6">
        <div className="flex items-center gap-2 text-fail-text">
          <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
          <h1 className="text-[15px] font-semibold">Something broke on this screen</h1>
        </div>
        <p className="mt-2 text-[13px] text-ink-muted">
          The error is logged to the console and the server log so it can be fixed.
        </p>
        <pre className="mono mt-3 max-h-40 overflow-auto rounded-sm bg-surface-sunk p-3 text-[11.5px] text-ink">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => unstable_retry()}>
            <RotateCw className="h-4 w-4" strokeWidth={1.75} /> Try again
          </Button>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm text-ink-muted hover:text-ink"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
