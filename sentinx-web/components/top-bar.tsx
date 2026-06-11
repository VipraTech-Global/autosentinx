import Link from "next/link";
import { Plus, Download, LogOut } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import type { Run } from "@/lib/types";

export function TopBar({ run }: { run: Run }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-13 max-w-6xl items-center gap-4 px-5 py-2.5">
        {/* wordmark routes to the run home (Findings), never Landing */}
        <Link href={`/runs/${run.id}`} aria-label="AutoSentinx — run home">
          <Logo />
        </Link>
        <span className="hidden items-center gap-2 text-[12px] text-ink-muted sm:flex">
          <span className="text-border">/</span>
          <span className="mono text-ink">{run.id}</span>
          <span className="text-ink-faint">·</span>
          <span>{run.agentName}</span>
          <span className="text-ink-faint">·</span>
          <span className="mono text-ink-faint">{run.endedAt ?? run.startedAt}</span>
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] text-ink-muted hover:border-brand/40 hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> New audit
          </Link>
          <Link
            href={`/runs/${run.id}/report`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-2.5 text-[12.5px] font-medium text-on-brand hover:bg-brand-strong"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Export
          </Link>
          <ThemeToggle />
          <Link
            href="/login"
            aria-label="Sign out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-ink-muted hover:text-ink"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </header>
  );
}
