import { cn } from "@/lib/cn";
import type { Severity, Outcome, Pillar, OracleType } from "@/lib/types";
import { SEVERITY_META, OUTCOME_META, PILLAR_LABEL, ORACLE_LABEL } from "@/lib/outcome";

/** Severity chip — colour AND shape AND label (DESIGN.md §5, colour-blind safe). */
export function SeverityChip({ severity, className }: { severity: Severity; className?: string }) {
  const m = SEVERITY_META[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide tnum",
        className,
      )}
      style={{ color: m.text, borderColor: m.fill, backgroundColor: "color-mix(in srgb, " + m.fill + " 8%, transparent)" }}
    >
      <span aria-hidden style={{ color: m.fill }}>{m.shape}</span>
      {m.label}
    </span>
  );
}

/** Outcome badge — FAIL / RISK / PASS, colour + shape + label. */
export function OutcomeBadge({ outcome, className }: { outcome: Outcome; className?: string }) {
  const m = OUTCOME_META[outcome];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        className,
      )}
      style={{ color: m.text, backgroundColor: "color-mix(in srgb, " + m.fill + " 12%, transparent)" }}
    >
      <span aria-hidden style={{ color: m.fill }}>{m.shape}</span>
      {m.label}
    </span>
  );
}

export function ModuleTag({ module, className }: { module: Pillar; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border px-1.5 py-0.5 text-[11px] font-medium text-ink-muted",
        className,
      )}
    >
      {PILLAR_LABEL[module]}
    </span>
  );
}

export function OracleTag({ oracle, className }: { oracle: OracleType; className?: string }) {
  return (
    <span className={cn("text-[11px] text-ink-faint", className)}>{ORACLE_LABEL[oracle]}</span>
  );
}
