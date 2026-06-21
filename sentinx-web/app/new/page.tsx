"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { MinimalBar } from "@/components/minimal-bar";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { startScan, approveScan } from "@/lib/api";
import { IntensityDial } from "@/components/live/intensity-dial";
import { INTENSITY } from "@/lib/intensity";
import type { IntensityLevel } from "@/lib/runview";

type Phase = "form" | "checking" | "approve" | "approving";

export default function RunConfigPage() {
  const router = useRouter();
  const [endpoint, setEndpoint] = useState("https://aarav-api-793989842362.asia-south1.run.app");
  const [agent, setAgent] = useState("AARAV — NBFC voice debt-collection agent");
  const [advanced, setAdvanced] = useState(false);
  const [token, setToken] = useState("");
  const [notes, setNotes] = useState("");
  const [intensity, setIntensity] = useState<IntensityLevel>("med");
  const [phase, setPhase] = useState<Phase>("form");
  const [runId, setRunId] = useState("");
  const [err, setErr] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setPhase("checking");
    try {
      // create the run (pending_approval) — the scan runs against the exact endpoint entered above.
      // intensity dial (EP-11) drives BOTH budget (# attacks) and max_turns (depth/attack) server-side.
      const cfg = INTENSITY[intensity];
      const { run_id } = await startScan({
        endpoint, agentName: agent,
        budget: cfg.attacks === "all" ? 37 : cfg.attacks,
        intensity, maxTurns: cfg.turns,
      });
      setRunId(run_id);
      setPhase("approve");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not start the run.");
      setPhase("form");
    }
  }

  async function approve() {
    setErr("");
    setPhase("approving");
    try {
      await approveScan(runId);
      router.push(`/runs/${runId}/processing`);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Approval failed.");
      setPhase("approve");
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <MinimalBar />
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-12">
        {phase !== "approve" && phase !== "approving" ? (
          <form onSubmit={run}>
            <h1 className="text-xl font-semibold tracking-tight text-ink">New audit</h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              Point AutoSentinx at a target voice agent and run one evaluation.
            </p>

            <div className="mt-6 space-y-4">
              <Field label="Target API endpoint" htmlFor="endpoint" hint="The agent's API base URL — AutoSentinx appends the voice-call path. This exact URL is what gets scanned.">
                <Input id="endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="mono text-[13px]" required />
              </Field>
              <Field label="Agent name" htmlFor="agent">
                <Input id="agent" value={agent} onChange={(e) => setAgent(e.target.value)} />
              </Field>

              <button
                type="button"
                onClick={() => setAdvanced((a) => !a)}
                aria-expanded={advanced}
                className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${advanced ? "rotate-180" : ""}`} strokeWidth={1.5} />
                Advanced
              </button>
              {advanced && (
                <div className="space-y-4 rounded-md border border-border bg-surface p-4">
                  <Field label="Bearer token (optional)" htmlFor="token">
                    <Input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Authorization: Bearer …" className="mono text-[13px]" />
                  </Field>
                  <Field label="Notes (optional)" htmlFor="notes">
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. post-remediation re-test" />
                  </Field>
                </div>
              )}

              <IntensityDial value={intensity} onChange={setIntensity} />

              <div className="rounded-md bg-surface-sunk px-3 py-2 text-[12px] text-ink-muted">
                Will run <span className="text-ink">Security + Compliance</span> · multi-turn Hinglish plays against the endpoint above. Coverage &amp; depth are set by the <span className="text-ink">{intensity}</span> intensity above.
              </div>

              <Button type="submit" className="w-full" disabled={phase === "checking" || !endpoint}>
                {phase === "checking" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> Connecting…</>
                ) : (
                  "Run audit"
                )}
              </Button>
              {phase === "checking" && (
                <p className="text-center text-[12px] text-ink-muted">Creating run · recording rules of engagement…</p>
              )}
              {err && <p role="alert" className="text-center text-[12.5px] text-fail-text">{err}</p>}
            </div>
          </form>
        ) : (
          <Card className="p-6">
            <div className="flex items-center gap-2 text-ink-muted">
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
              <span className="text-[13px] font-medium">Run created — awaiting approval</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-ink">Approve &amp; run</h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              AutoSentinx requires human approval before any campaign executes (Rules of Engagement).
            </p>

            <dl className="mt-5 space-y-2 rounded-md border border-border bg-surface-sunk p-4 text-[12.5px]">
              <Row k="Run ref" v={runId} mono />
              <Row k="Target" v={endpoint} mono />
              <Row k="Agent" v={agent || "AARAV — NBFC voice debt-collection agent"} />
              <Row k="Scope" v={`Security + Compliance · ${INTENSITY[intensity].attacks === "all" ? "full catalog" : INTENSITY[intensity].attacks + " attacks"} · ${intensity} intensity`} />
              <Row k="Data" v="Synthetic borrower personas · contact names shown are test data, not real PII" />
            </dl>

            <div className="mt-5 flex gap-2">
              <Button className="flex-1" onClick={approve} disabled={phase === "approving"}>
                {phase === "approving" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> Approving…</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" strokeWidth={1.75} /> Approve &amp; run</>
                )}
              </Button>
              <Button variant="secondary" onClick={() => setPhase("form")} disabled={phase === "approving"}>
                Back
              </Button>
            </div>
            {err && (
              <p role="alert" aria-live="polite" className="mt-3 text-[12.5px] text-fail-text">
                {err}
              </p>
            )}
            <p className="mt-3 text-[11px] text-ink-muted">
              Approving records an immutable audit-log entry (operator, scope, timestamp).
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{k}</dt>
      <dd className={`text-right text-ink ${mono ? "mono text-[12px]" : ""} truncate`}>{v}</dd>
    </div>
  );
}
