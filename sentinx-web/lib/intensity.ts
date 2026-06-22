// Run-Intensity dial (D-LV25) — the [low..ultra] effort control on Run Config (C3).
// Scales attacks (campaign budget) / turns-per-attack (max_turns) / breadth
// (technique×persona variants per objective). Judges stay FIXED across levels
// (constant grading rigor for fair comparison). Numbers are tunable defaults.

import type { IntensityLevel } from "./runview";

export interface IntensityConfig {
  level: IntensityLevel;
  label: string;
  attacks: number | "all";   // campaign budget (# plays); "all" = full catalog
  turns: number;             // max_turns per attack
  breadth: number;           // technique×persona variants per objective
  blurb: string;
}

export const INTENSITY: Record<IntensityLevel, IntensityConfig> = {
  low:   { level: "low",   label: "Low",    attacks: 8,    turns: 8,  breadth: 1, blurb: "Quick smoke — top-severity only." },
  med:   { level: "med",   label: "Medium", attacks: 16,   turns: 16, breadth: 1, blurb: "Standard sweep — both pillars." },
  high:  { level: "high",  label: "High",   attacks: 28,   turns: 18, breadth: 2, blurb: "Thorough — two styles per objective." },
  xhigh: { level: "xhigh", label: "X-High", attacks: 40,   turns: 20, breadth: 2, blurb: "Broad — most objectives, both pillars." },
  max:   { level: "max",   label: "Max",    attacks: 60,   turns: 24, breadth: 3, blurb: "Near-exhaustive, multi-style." },
  ultra: { level: "ultra", label: "Ultra",  attacks: "all", turns: 30, breadth: 99, blurb: "Exhaustive — full catalog × all techniques." },
};

export const LEVELS: IntensityLevel[] = ["low", "med", "high", "xhigh", "max", "ultra"];
export const DEFAULT_LEVEL: IntensityLevel = "med";

/** A rough, honest estimate (the live hint next to the dial, like Claude Code's effort). */
export function estimate(level: IntensityLevel, catalogSize = 37): { attacks: number; calls: number; minutes: string } {
  const c = INTENSITY[level];
  const attacks = c.attacks === "all" ? catalogSize * Math.min(c.breadth, 3) : c.attacks;
  // ~ attacks × (turns target+attacker LLM calls) + judging; coarse order-of-magnitude
  const calls = attacks * (c.turns * 2 + 4);
  // ~15s/turn median wall-clock, parallelised; coarse range
  const lo = Math.round((attacks * c.turns * 8) / 60);
  const hi = Math.round((attacks * c.turns * 18) / 60);
  return { attacks, calls, minutes: `${lo}–${hi} min` };
}
