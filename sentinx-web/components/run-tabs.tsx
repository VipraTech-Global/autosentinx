"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Thin in-run top nav: switch between Overview (exec summary) and Findings.
 *  Active tab is a filled Azure-Cobalt pill so it's unmistakable. */
export function RunTabs({ runId, findingsCount }: { runId: string; findingsCount?: number }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/runs/${runId}`, label: "Overview", exact: true, count: undefined as number | undefined },
    { href: `/runs/${runId}/findings`, label: "Findings", exact: false, count: findingsCount },
  ];

  return (
    <nav aria-label="Run views" className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-5 py-2">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-brand text-on-brand shadow-[var(--shadow-elev)]"
                  : "text-ink-muted hover:bg-surface-sunk hover:text-ink",
              )}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    "tnum rounded-sm px-1 text-[11px]",
                    active ? "bg-white/20 text-on-brand" : "bg-surface-sunk text-ink-faint",
                  )}
                >
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
