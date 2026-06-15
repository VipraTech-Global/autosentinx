"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Download } from "lucide-react";
import type { Observation, Run, Pillar, Severity, Outcome } from "@/lib/types";
import { severityRank } from "@/lib/outcome";
import { SeverityChip, OutcomeBadge, ModuleTag } from "./badges";
import { cn } from "@/lib/cn";

function strongest(o: Observation) {
  const e = [...o.crosswalk].sort((a, b) => b.strength - a.strength)[0];
  return e ? `${e.framework} ${e.controlId}` : "—";
}

type OutcomeFilter = "all" | Outcome;
type ModuleFilter = "all" | Pillar;
type SevFilter = "all" | Severity;

export function ObservationsTable({ run }: { run: Run }) {
  const router = useRouter();
  const [mod, setMod] = useState<ModuleFilter>("all");
  const [out, setOut] = useState<OutcomeFilter>("all");
  const [sev, setSev] = useState<SevFilter>("all");

  const rows = useMemo(() => {
    return [...run.observations]
      .filter((o) => (mod === "all" ? true : o.module === mod))
      .filter((o) => (out === "all" ? true : o.outcome === out))
      .filter((o) => (sev === "all" ? true : o.severity === sev))
      .sort((a, b) => {
        const s = severityRank(b.severity) - severityRank(a.severity);
        if (s !== 0) return s;
        return b.verdictScore - a.verdictScore;
      });
  }, [run.observations, mod, out, sev]);

  const filtered = mod !== "all" || out !== "all" || sev !== "all";

  function clearFilters() {
    setMod("all");
    setOut("all");
    setSev("all");
  }

  return (
    <div>
      <p className="mb-2 text-[12px] text-ink-muted">
        One attack can breach two duties; it is listed once per duty so Security and Compliance can
        be reviewed independently.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select label="Module" value={mod} onChange={(v) => setMod(v as ModuleFilter)} options={[["all", "All modules"], ["security", "Security"], ["compliance", "Compliance"]]} />
        <Select label="Outcome" value={out} onChange={(v) => setOut(v as OutcomeFilter)} options={[["all", "All outcomes"], ["FAIL", "FAIL"], ["RISK", "RISK"], ["PASS", "PASS"]]} />
        <Select label="Severity" value={sev} onChange={(v) => setSev(v as SevFilter)} options={[["all", "All severities"], ["critical", "Critical"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]]} />
        {filtered && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[12px] text-ink-muted hover:text-brand underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-[12px] text-ink-muted tnum">
          {rows.length} observation{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-sunk text-[11px] uppercase tracking-wide text-ink-muted">
              <Th>ID</Th>
              <Th className="min-w-[16rem]">Scenario</Th>
              <Th>Module</Th>
              <Th>Outcome</Th>
              <Th>Severity</Th>
              <Th>Reg Ref</Th>
              <Th>Detected</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr
                key={o.id}
                tabIndex={0}
                role="button"
                aria-label={`Open finding ${o.id}`}
                onClick={() => router.push(`/runs/${run.id}/o/${o.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/runs/${run.id}/o/${o.id}`);
                  }
                }}
                className="cursor-pointer border-t border-border bg-surface hover:bg-surface-sunk focus-visible:bg-surface-sunk"
              >
                <Td>
                  <span className="mono text-[12px] text-ink">{o.id}</span>
                  {o.incidentId && (
                    <span title={`Linked: same attack also appears in the other module`} className="ml-1.5 inline-flex">
                      <Link2 className="h-3 w-3 text-brand" strokeWidth={1.5} />
                    </span>
                  )}
                </Td>
                <Td className="text-[13px] text-ink">{o.title}</Td>
                <Td><ModuleTag module={o.module} /></Td>
                <Td><OutcomeBadge outcome={o.outcome} /></Td>
                <Td><SeverityChip severity={o.severity} /></Td>
                <Td><span className="mono text-[11.5px] text-ink-muted">{strongest(o)}</span></Td>
                <Td><span className="mono text-[11.5px] text-ink-muted">{o.detectedIn}</span></Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="border-t border-border bg-surface px-4 py-10 text-center text-[13px] text-ink-muted">
                  No observations match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[12px] text-ink-muted">
          {filtered ? "Filtered view." : `${run.observations.length} findings across ${attacks(run)} attacks.`}
        </p>
        <a
          href={`/runs/${run.id}/report`}
          className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-brand"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Export PDF report
        </a>
      </div>
    </div>
  );
}

function attacks(run: Run) {
  const inc = new Set<string>();
  let s = 0;
  for (const o of run.observations) o.incidentId ? inc.add(o.incidentId) : s++;
  return inc.size + s;
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th scope="col" className={cn("px-3 py-2 font-semibold", className)}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-md border border-border bg-surface px-2 text-[12.5px] text-ink outline-none focus-visible:border-brand"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
