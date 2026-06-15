"use client";

import { useEffect, useState } from "react";
import { getRun } from "./api";
import type { Run } from "./types";

// Poll guard (contract gap #5): a run that is created but never approved is masked as
// "running" with playsDone=0 forever, so the interval would never clear. Stop polling
// after a bounded wall-clock budget, or sooner if it stalls at zero progress, and surface
// a "stalled" flag so the UI can stop spinning instead of polling indefinitely.
const MAX_POLL_MS = 10 * 60 * 1000; // hard cap on total polling
const STALL_MS = 90 * 1000; // no progress (playsDone===0) for this long → give up

/** Fetch a run; if `pollMs > 0`, re-fetch on an interval until status leaves "running". */
export function useRun(
  id: string,
  pollMs = 0,
): { run: Run | null; error: string; stalled: boolean } {
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState("");
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const startedAt = Date.now();
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };
    const load = async () => {
      try {
        const r = await getRun(id);
        if (!alive) return;
        setRun(r);
        if (pollMs > 0 && r.status !== "running") {
          stop();
          return;
        }
        if (pollMs > 0) {
          const elapsed = Date.now() - startedAt;
          if (elapsed > MAX_POLL_MS || (r.playsDone === 0 && elapsed > STALL_MS)) {
            setStalled(true);
            stop();
          }
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    };
    load();
    if (pollMs > 0) timer = setInterval(load, pollMs);
    return () => {
      alive = false;
      stop();
    };
  }, [id, pollMs]);

  return { run, error, stalled };
}
