"use client";
// Run-Intensity dial (D-LV25) — the [low..ultra] effort control on Run Config.
import { Gauge } from "lucide-react";
import { INTENSITY, LEVELS, estimate } from "@/lib/intensity";
import type { IntensityLevel } from "@/lib/runview";

export function IntensityDial({ value, onChange }: { value: IntensityLevel; onChange: (l: IntensityLevel) => void }) {
  const cfg = INTENSITY[value];
  const est = estimate(value);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5 text-[12.5px] text-ink">
        <Gauge className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
        <span className="font-medium">Run intensity</span>
        <span className="text-ink-muted text-[11px]">more attacks, deeper turns, wider technique mix — judging rigor stays fixed across levels</span>
      </div>
      <div role="radiogroup" aria-label="Run intensity" className="inline-flex w-full rounded-md border border-border overflow-hidden">
        {LEVELS.map((lv, i) => {
          const on = lv === value;
          return (
            <button key={lv} type="button" role="radio" aria-checked={on} onClick={() => onChange(lv)}
              className={`flex-1 text-[11.5px] mono py-1.5 capitalize transition-colors ${i ? "border-l border-border" : ""} ${on ? "bg-brand-soft text-brand font-semibold" : "text-ink-muted hover:bg-surface-sunk"}`}>
              {INTENSITY[lv].label}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3 text-[11.5px]">
        <span className="text-ink-muted">{cfg.blurb}</span>
        <span className="mono text-ink-muted shrink-0 tnum" title="rough estimate — actual depends on target latency, early-stops, and judge time">{cfg.attacks === "all" ? "full catalog" : `${cfg.attacks} attacks`} · {cfg.turns} turns · est. {est.minutes}</span>
      </div>
    </div>
  );
}
