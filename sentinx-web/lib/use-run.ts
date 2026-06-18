"use client";

import { useEffect, useState } from "react";
import { getRun } from "./api";
import type { Run } from "./types";

// Poll guard. The console masks pending_approval as "running" with playsDone=0, and a run
// stays at 0 during recon and while the first multi-turn play + judge panel runs — which can
// take minutes. So progress, not "still at zero", drives the stall decision:
//   - "stalled" = NO forward progress (playsDone unchanged) for STALL_MS. We DO NOT hard-stop:
//     we keep polling on a backed-off cadence so the screen self-recovers when the next play
//     lands (no manual refresh — issue #5), and clear the flag the moment progress resumes.
//   - We fully stop ONLY on a terminal status (the real "done" signal). We impose NO wall-clock
//     cap: a real run (6 plays × up to 8 turns × ~120s target timeout) can outlast any fixed
//     cap, so a cap would itself false-stall it. The backed-off poll keeps a genuinely stuck
//     run cheap, and unmount clears the timer.
// A single AARAV play (multi-turn convo + 3-judge Gemini panel) is ~60-90s+, and a full
// budget-6 run is several minutes — STALL_MS must sit above worst-case single-play latency.
const STALL_MS = 5 * 60 * 1000; // no forward progress this long → flag stalled (keep polling, slowed)
const SLOW_POLL_MS = 8000; // backed-off cadence once stalled, so a stuck poll stays cheap

/** Fetch a run; if `pollMs > 0`, re-fetch until status leaves "running". */
export function useRun(
  id: string,
  pollMs = 0,
): { run: Run | null; error: string; stalled: boolean } {
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState("");
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Effect-scoped (reset on every [id, pollMs] re-run, so run A's progress never leaks into run B).
    let lastDone = -1;
    let lastProgressAt = Date.now();

    const stop = () => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    const tick = async () => {
      try {
        const r = await getRun(id);
        if (!alive) return;
        setRun(r);
        setError(""); // recover from a transient fetch error on the next good poll

        // Terminal status is the real "done" signal — the only full stop.
        if (r.status !== "running") {
          setStalled(false);
          return;
        }
        if (pollMs <= 0) return; // single fetch, no polling requested

        // Reset the stall clock whenever playsDone advances (monotonic within a run).
        const done = Number(r.playsDone) || 0;
        if (done > lastDone) {
          lastDone = done;
          lastProgressAt = Date.now();
        }
        const sinceProgress = Date.now() - lastProgressAt;

        // No forward progress for a while → flag stalled, but KEEP polling (slower) so it
        // self-recovers when the next play lands. `stalled` is reversible: it returns to false
        // above as soon as progress resumes. Self-rescheduling setTimeout lets the cadence
        // change (a fixed setInterval can't be slowed in place); awaiting before scheduling the
        // next tick also means only one request is ever in flight (no out-of-order clobber).
        const nowStalled = sinceProgress > STALL_MS;
        setStalled(nowStalled);
        timer = setTimeout(tick, nowStalled ? SLOW_POLL_MS : pollMs);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
        // Transient error: retry on the slow cadence rather than giving up.
        if (pollMs > 0) timer = setTimeout(tick, SLOW_POLL_MS);
      }
    };

    tick();
    return () => {
      alive = false;
      stop();
    };
  }, [id, pollMs]);

  return { run, error, stalled };
}
