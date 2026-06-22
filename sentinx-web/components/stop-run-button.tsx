"use client";

import { useState } from "react";
import { Square, Loader2 } from "lucide-react";
import { stopRun } from "@/lib/api";

/** Stop a running campaign. Cooperative on the backend — the in-flight play finishes, then the run
 *  halts and is marked completed with whatever ran. Shown only while a run is live (post-approval,
 *  pre-completion). Self-contained: stops event propagation so it works inside clickable run rows. */
export function StopRunButton({
  runId,
  onStopped,
  size = "md",
}: {
  runId: string;
  onStopped?: () => void;
  size?: "sm" | "md";
}) {
  const [busy, setBusy] = useState(false);
  const [requested, setRequested] = useState(false);

  async function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || requested) return;
    setBusy(true);
    try {
      await stopRun(runId);
      setRequested(true);
      onStopped?.();
    } catch {
      /* leave the button active so the operator can retry */
    } finally {
      setBusy(false);
    }
  }

  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[11.5px]";
  return (
    <button
      type="button"
      onClick={stop}
      disabled={busy || requested}
      aria-label="Stop run"
      title={requested ? "Stopping after the current play…" : "Stop this run — finishes the current play, then halts"}
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-default ${pad} ${
        requested
          ? "border-border text-ink-faint"
          : "border-fail-text/40 text-fail-text hover:bg-fail/10"
      }`}
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> : <Square className="h-3 w-3" strokeWidth={2} fill="currentColor" />}
      {requested ? "Stopping…" : "Stop run"}
    </button>
  );
}
