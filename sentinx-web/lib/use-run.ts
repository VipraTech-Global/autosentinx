"use client";

import { useEffect, useState } from "react";
import { getRun } from "./api";
import type { Run } from "./types";

/** Fetch a run; if `pollMs > 0`, re-fetch on an interval until status leaves "running". */
export function useRun(id: string, pollMs = 0): { run: Run | null; error: string } {
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = async () => {
      try {
        const r = await getRun(id);
        if (!alive) return;
        setRun(r);
        if (pollMs > 0 && r.status !== "running" && timer) clearInterval(timer);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    };
    load();
    if (pollMs > 0) timer = setInterval(load, pollMs);
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [id, pollMs]);

  return { run, error };
}
