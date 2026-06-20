"use client";
// Shared run-level nav for the live views — consistent with the app's TopBar/RunTabs chrome so V2/V3
// stop feeling like a separate app. Run identity + screen tabs (Overview·Live·Findings·Report) + the
// persona ROLE switch (lands each role on their home screen, personas §ownership). Live-specific
// controls (zoom, Arena⇄Processing, sample switcher, V3 stepper) live in a thin sub-bar the page renders.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { ROLES, getRole, setRole, roleHref, screenHref, canSeeLive, type Role, type RunScreen } from "@/lib/role";

const TABS: { screen: RunScreen; label: string }[] = [
  { screen: "overview", label: "Overview" },
  { screen: "live", label: "Live" },
  { screen: "findings", label: "Findings" },
  { screen: "report", label: "Report" },
];

export function RunNav({ runId, current, runLabel, target, data }: {
  runId: string; current: RunScreen; runLabel?: string; target?: string; data?: string;
}) {
  const router = useRouter();
  const [role, setRoleState] = useState<Role | null>(null); // null until mounted → no SSR/first-paint role leak
  useEffect(() => setRoleState(getRole()), []);
  const onRole = (r: Role) => { setRole(r); setRoleState(r); router.push(roleHref(r, runId, { data })); };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="flex items-center gap-3 px-5 h-14">
        <Link href={screenHref("overview", runId)} aria-label="AutoSentinX — run home" className="shrink-0">
          <Logo />
        </Link>
        {runLabel ? <span className="mono text-[12px] text-ink-muted hidden lg:inline truncate max-w-[230px]">{runLabel}{target ? ` · ${target}` : ""}</span> : null}
        <nav aria-label="Run views" className="flex items-center gap-1 ml-1">
          {TABS.filter((t) => t.screen !== "live" || (role !== null && canSeeLive(role))).map((t) => {
            const active = t.screen === current;
            return (
              <Link key={t.screen} href={screenHref(t.screen, runId, { data })} aria-current={active ? "page" : undefined}
                className={`rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors ${active ? "bg-brand text-on-brand" : "text-ink-muted hover:bg-surface-sunk hover:text-ink"}`}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <span className="flex-1" />
        <label className="flex items-center gap-1.5 text-[11px] text-ink-faint" title="Lands you on this role's home screen (personas §ownership)">
          <span className="hidden md:inline">viewing as</span>
          <select value={role ?? "admin"} onChange={(e) => onRole(e.target.value as Role)} aria-label="Viewing-as role"
            className="mono text-[11.5px] bg-surface border border-border rounded-md px-2 py-1 text-ink cursor-pointer">
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        <ThemeToggle />
      </div>
    </header>
  );
}
