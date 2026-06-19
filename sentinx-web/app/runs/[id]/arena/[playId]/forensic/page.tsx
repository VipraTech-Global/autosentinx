"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Forensic from "@/components/live/forensic";
import { fromStateJson, type RunView } from "@/lib/runview";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ForensicPage() {
  const params = useParams<{ id: string; playId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const data = search.get("data") ?? "live-8play";
  const playIdx = Number(params?.playId ?? 0);
  const [run, setRun] = useState<RunView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/runs/${data}.json`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`load ${data} failed`); return r.json(); })
      .then((raw) => { if (live) setRun(fromStateJson(raw, String(params?.id ?? "ER-LIVE"))); })
      .catch((e) => live && setErr(String(e)));
    return () => { live = false; };
  }, [data, params?.id]);

  const play = run?.plays.find((p) => p.idx === playIdx) ?? null;
  const backToArena = () => router.push(`/runs/${params?.id}/arena?data=${data}`);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-5 h-14 border-b border-border bg-bg/90 backdrop-blur">
        <span className="flex items-center gap-2 font-semibold text-[15px]">SENTIN<span className="text-brand">X</span><span className="text-ink-faint text-[11px] font-normal">· forensic (view 3) · internal</span></span>
        <span className="flex-1" />
        <span className="inline-flex border border-border rounded-md overflow-hidden text-[11px] mono">
          <span className="px-2.5 py-1 text-ink-faint cursor-not-allowed">Glance</span>
          <button className="px-2.5 py-1 text-ink-muted border-l border-border hover:bg-surface-sunk" onClick={backToArena}>Arena</button>
          <span className="px-2.5 py-1 bg-brand-soft text-brand border-l border-border">Forensic</span>
        </span>
        <ThemeToggle />
      </header>
      {err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-fail-text">{err}</div> : null}
      {run && !play ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-ink-faint">play {playIdx} not found</div> : null}
      {run && play ? <Forensic run={run} play={play} onRollUp={backToArena} /> : (!err ? <div className="max-w-[700px] mx-auto mt-20 text-center mono text-ink-faint">loading…</div> : null)}
    </div>
  );
}
