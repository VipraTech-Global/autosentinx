"use client";
// THE single shared run-level nav for EVERY run screen (live + overview-type) — one consistent top
// nav so the app stops feeling like two apps. Screen tabs (Overview·Live·Findings) + a fixed top-right
// cluster [New audit · Export · Runs · role <select> · theme · Sign out]. Run identity moved to the
// page footer (RunFooter). Live-specific controls (zoom Arena·Detail·Passive, V3 stepper) live in a
// thin sub-bar the live page renders. 'Report' is renamed 'Export' globally and is a right-cluster
// button (not a tab), routing to /runs/{id}/report and gated like Findings/Overview.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Download, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { ROLES, getRole, setRole, roleHref, screenHref, canSeeLive, type Role, type RunScreen } from "@/lib/role";

const TABS: { screen: RunScreen; label: string }[] = [
  { screen: "overview", label: "Overview" },
  { screen: "live", label: "Live" },
  { screen: "findings", label: "Findings" },
];

export function RunNav({ runId, current, runLabel, target, firstPlayIdx, findingsReady = true }: {
  runId: string; current: RunScreen; runLabel?: string; target?: string; firstPlayIdx?: number;
  // Overview/Findings tabs + the Export button are gated until the first attack has produced a result
  // — faded + non-clickable while only recon/early plays are in flight (there is nothing to show yet).
  // runLabel/target are retained in the signature (future footer-on-live) but no longer render here —
  // the run-identity breadcrumb now lives in RunFooter at the page bottom.
  findingsReady?: boolean;
}) {
  const router = useRouter();
  const [role, setRoleState] = useState<Role | null>(null); // null until mounted → no SSR/first-paint role leak
  useEffect(() => setRoleState(getRole()), []);
  const onRole = (r: Role) => { setRole(r); setRoleState(r); router.push(roleHref(r, runId, { firstPlay: firstPlayIdx })); };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="flex items-center gap-3 px-5 h-14">
        <Link href={screenHref("overview", runId)} aria-label="AutoSentinX — run home" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Run views" className="flex items-center gap-1 ml-1">
          {TABS.filter((t) => t.screen !== "live" || (role !== null && canSeeLive(role))).map((t) => {
            const active = t.screen === current;
            // Overview AND Findings gate on the same findingsReady (first attack complete); never gate the
            // current page so a deep-linked Overview/Findings keeps its own active tab clickable-as-active.
            const gated = !findingsReady && (t.screen === "findings" || t.screen === "overview") && t.screen !== current;
            if (gated) {
              return (
                <span key={t.screen} aria-disabled="true" title="Available once the first attack completes"
                  className="rounded-md px-2.5 py-1 text-[12.5px] font-medium text-ink-faint opacity-40 cursor-not-allowed select-none">
                  {t.label}
                </span>
              );
            }
            return (
              <Link key={t.screen} href={screenHref(t.screen, runId)} aria-current={active ? "page" : undefined}
                className={`rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors ${active ? "bg-brand text-on-brand" : "text-ink-muted hover:bg-surface-sunk hover:text-ink"}`}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <span className="flex-1" />
        {/* Unified right cluster — byte-identical to the old TopBar so positions never drift across screens.
            New audit · Export · Runs · role <select> · ThemeToggle · Sign out. */}
        <Link
          href="/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] text-ink-muted hover:border-brand/40 hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> New audit
        </Link>
        {findingsReady ? (
          <Link
            href={screenHref("report", runId)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-2.5 text-[12.5px] font-medium text-on-brand hover:bg-brand-strong"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Export
          </Link>
        ) : (
          <span
            aria-disabled="true"
            title="Available once the first attack completes"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-2.5 text-[12.5px] font-medium text-on-brand opacity-40 cursor-not-allowed select-none"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Export
          </span>
        )}
        <Link
          href="/runs"
          className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-[12.5px] text-ink-muted hover:border-brand/40 hover:text-ink"
        >
          Runs
        </Link>
        <label className="flex items-center gap-1.5 text-[11px] text-ink-faint" title="Lands you on this role's home screen (personas §ownership)">
          <span className="hidden md:inline">viewing as</span>
          <select value={role ?? "admin"} onChange={(e) => onRole(e.target.value as Role)} aria-label="Viewing-as role"
            className="mono text-[11.5px] bg-surface border border-border rounded-md px-2 py-1 text-ink cursor-pointer">
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        <ThemeToggle />
        <Link
          href="/login"
          aria-label="Sign out"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-ink-muted hover:text-ink"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  );
}
