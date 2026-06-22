// Run-identity breadcrumb, moved out of the old TopBar to the BOTTOM of overview-type screens.
// "{runId} · {agentName} · {fmtIST(ts)}" — e.g. "RUN-… · AARAV — NBFC voice debt-collection agent · 21 Jun 2026 23:39 IST".
// Presentational only (fmtIST is pure) — no "use client" needed.
import { fmtIST } from "@/lib/time";

export function RunFooter({ runId, agentName, ts }: { runId: string; agentName: string; ts?: string | null }) {
  return (
    <footer className="mx-auto max-w-6xl px-5 py-6 mt-8 border-t border-border text-[12px] text-ink-muted">
      <span className="mono text-ink">{runId}</span>
      {" · "}
      <span>{agentName}</span>
      {" · "}
      <span className="mono text-ink-faint">{fmtIST(ts)}</span>
    </footer>
  );
}
