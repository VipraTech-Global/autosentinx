// Live adapter — same-origin calls to the BFF (/api/*), which proxies to the FastAPI backend.
// Maps the backend console view-model into the `Run` type and fills the UI-derived `outcome`.
import type { Run, Observation, Outcome } from "./types";
import { deriveOutcome } from "./outcome";

async function req(path: string, init?: RequestInit): Promise<Response> {
  const r = await fetch(path, { cache: "no-store", ...init });
  if (!r.ok) {
    let detail = r.statusText;
    try {
      detail = (await r.json()).detail ?? detail;
    } catch {
      /* non-JSON error */
    }
    throw new Error(detail);
  }
  return r;
}

export async function login(email: string, password: string): Promise<{ email: string }> {
  const r = await req("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export interface ScanConfig {
  endpoint?: string;
  agentName?: string;
  budget?: number;
}

export async function startScan(cfg: ScanConfig = {}): Promise<{ run_id: string; status: string }> {
  const q = new URLSearchParams({ strategy: "ucb", budget: String(cfg.budget ?? 6) });
  // The scan runs against the exact URL the user enters (any AARAV-compatible agent).
  if (cfg.endpoint) q.set("target", cfg.endpoint.trim());
  const r = await req(`/api/scan?${q.toString()}`, { method: "POST" });
  return r.json();
}

export async function approveScan(runId: string): Promise<void> {
  await req(`/api/runs/${runId}/approve`, { method: "POST" });
}

// The console emits Observations without the UI-derived FAIL/RISK/PASS; fill it here (single source: outcome.ts).
function withOutcomes(run: Run & { observations: Array<Omit<Observation, "outcome"> & { outcome?: Outcome }> }): Run {
  const obs = (run.observations ?? [])
    .map((o) => {
      const fairnessOutcome: Outcome | undefined =
        o.oracle === "fairness" ? (o.rawOutcome === "succeeded" ? "FAIL" : "PASS") : undefined;
      const outcome = deriveOutcome({
        rawOutcome: o.rawOutcome,
        oracle: o.oracle,
        judgeVotes: o.judgeVotes ?? [],
        verdictScore: o.verdictScore ?? 0,
        fairnessOutcome,
      });
      return outcome ? ({ ...o, outcome } as Observation) : null;
    })
    .filter((o): o is Observation => o !== null);
  return { ...run, observations: obs } as Run;
}

export async function getRun(runId: string): Promise<Run> {
  const r = await req(`/api/console/runs/${runId}`);
  return withOutcomes(await r.json());
}

export async function listRuns(): Promise<{ runs: Array<Pick<Run, "id" | "status" | "agentName" | "startedAt" | "playsDone" | "playsTotal">> }> {
  const r = await req("/api/console/runs");
  return r.json();
}
