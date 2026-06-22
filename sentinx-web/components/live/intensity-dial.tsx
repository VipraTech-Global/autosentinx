"use client";
// Run-Intensity slider (D-LV25) — the [low..ultra] effort control on Run Config. A native range input
// drives interaction + a11y (keyboard, drag, click-to-position); the visual layers (heat-ramp fill +
// thumb) sit beneath it. Intensity reads as HEAT: cool brand at Low, warming through amber to red, with
// the Ultra moment — a shimmering sweep grounded in the SENTINX tokens (cf. globals.css .intensity-*).
import { Gauge, Zap } from "lucide-react";
import { INTENSITY, LEVELS, estimate } from "@/lib/intensity";
import type { IntensityLevel } from "@/lib/runview";

// Thumb / level-name colour per stop — the "current heat".
const HEAT = ["var(--brand)", "var(--brand)", "var(--brand-strong)", "var(--warn)", "var(--fail)", "var(--fail)"];

export function IntensityDial({ value, onChange }: { value: IntensityLevel; onChange: (l: IntensityLevel) => void }) {
  const idx = Math.max(0, LEVELS.indexOf(value));
  const pct = (idx / (LEVELS.length - 1)) * 100;
  const cfg = INTENSITY[value];
  const est = estimate(value);
  const isUltra = value === "ultra";
  const heat = HEAT[idx];

  return (
    <div>
      {/* header — label + the live level name (Ultra shimmers, with a ⚡) */}
      <div className="flex items-center gap-1.5 text-[12.5px] text-ink">
        <Gauge className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
        <span className="font-medium">Run intensity</span>
        <span className="ml-auto inline-flex items-center gap-1 mono text-[12px] font-semibold capitalize"
          style={isUltra ? undefined : { color: heat }}>
          {isUltra ? <Zap className="h-3.5 w-3.5" strokeWidth={2} style={{ color: "var(--fail)" }} /> : null}
          <span className={isUltra ? "intensity-word-ultra" : ""}>{cfg.label}</span>
        </span>
      </div>
      {/* one-line hint */}
      <p className="mt-0.5 text-[11px] text-ink-muted truncate">
        More attacks, deeper turns, wider technique mix — judging rigor stays fixed.
      </p>

      {/* slider — input (z-10, transparent) over the visual track/fill/thumb (z-0) */}
      <div className="relative mx-2 mt-3 flex h-6 select-none items-center">
        <input
          type="range" min={0} max={LEVELS.length - 1} step={1} value={idx}
          onChange={(e) => onChange(LEVELS[Number(e.target.value)])}
          aria-label="Run intensity" aria-valuetext={cfg.label}
          className="peer absolute inset-0 z-10 m-0 w-full cursor-pointer opacity-0"
        />
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 z-0 h-1.5 -translate-y-1/2 rounded-full bg-surface-sunk" />
        {/* fill — heat-ramp reveal, or the Ultra shimmer at full width */}
        <div
          className={`absolute left-0 top-1/2 z-0 h-1.5 -translate-y-1/2 rounded-full ${isUltra ? "intensity-fill-ultra" : ""}`}
          style={isUltra ? { width: "100%" } : {
            width: `${pct}%`,
            backgroundImage: "linear-gradient(90deg, var(--brand) 0%, var(--brand-strong) 38%, var(--warn) 72%, var(--fail) 100%)",
            backgroundSize: `${pct > 0 ? (100 / pct) * 100 : 100}% 100%`,
            backgroundPosition: "left center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* thumb */}
        <div
          className={`absolute top-1/2 z-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-[left] duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-brand ${isUltra ? "intensity-thumb-ultra" : "shadow-sm"}`}
          style={{ left: `${pct}%`, background: heat, borderColor: "var(--surface)" }}
        />
      </div>

      {/* tick labels — clickable (the input owns keyboard focus, so these are tabIndex -1) */}
      <div className="mx-2 mt-1.5 flex justify-between">
        {LEVELS.map((lv, i) => (
          <button key={lv} type="button" tabIndex={-1} onClick={() => onChange(lv)}
            className={`mono text-[10px] capitalize transition-colors ${i === idx ? "font-semibold text-ink" : "text-ink-faint hover:text-ink-muted"}`}>
            {INTENSITY[lv].label}
          </button>
        ))}
      </div>

      {/* one-line blurb + estimate (blurb truncates, estimate never wraps → always single line) */}
      <div className="mt-2 flex items-baseline justify-between gap-3 text-[11.5px]">
        <span className="truncate text-ink-muted">{cfg.blurb}</span>
        <span className="mono shrink-0 whitespace-nowrap text-ink-muted tnum" title="rough estimate — actual depends on target latency, early-stops, and judge time">
          {cfg.attacks === "all" ? "full catalog" : `${cfg.attacks} attacks`} · {cfg.turns} turns · est. {est.minutes}
        </span>
      </div>
    </div>
  );
}
