// Persona/role → home-screen routing (personas doc §ownership). A lightweight client-side role
// the run nav reads to (a) land each persona on their home view and (b) remember the choice.
// NOT auth — a review/demo convenience until real role-on-login exists (OPEN-LV-nav).

export type Role = "admin" | "security" | "exec" | "compliance";

export const ROLES: { id: Role; label: string; persona: string; home: string }[] = [
  { id: "admin", label: "Admin / QA", persona: "Priya", home: "Live Arena" },
  { id: "security", label: "Security", persona: "Arjun", home: "Forensic" },
  { id: "exec", label: "Exec", persona: "Ishaan", home: "Overview" },
  { id: "compliance", label: "Compliance", persona: "Meera", home: "Findings" },
];

export type RunScreen = "overview" | "live" | "findings" | "report" | "processing";

/** V2 Arena + V3 Forensic are RESTRICTED — only Admin/QA and Security may see the live duel
 *  (user, 2026-06-20). Everyone else sees Overview/Findings/Report/Processing but not Live. */
export const canSeeLive = (role: Role) => role === "admin" || role === "security";

/** Each role's home SCREEN (personas §ownership: Admin→Arena, Security→Forensic, Exec→Overview, Compliance→Findings). */
export const roleHomeScreen: Record<Role, RunScreen> = {
  admin: "live",
  security: "live", // Security owns Forensic → Live, opened at Detail (handled by the caller)
  exec: "overview",
  compliance: "findings",
};

/** Build the route for a screen. `data` (the fixture/live source) is carried so review mode keeps working. */
export function screenHref(screen: RunScreen, runId: string, opts?: { data?: string; playIdx?: number }): string {
  const q = opts?.data ? `?data=${opts.data}` : "";
  switch (screen) {
    case "overview": return `/runs/${runId}`;
    case "findings": return `/runs/${runId}/findings`;
    case "report": return `/runs/${runId}/report`;
    case "processing": return `/runs/${runId}/processing`;
    case "live": return `/runs/${runId}/arena${q}`;
  }
}

/** Where a role lands when picked. Security goes straight into a play's Forensic; others to their screen. */
export function roleHref(role: Role, runId: string, opts?: { data?: string; firstPlay?: number }): string {
  if (role === "security") {
    const q = opts?.data ? `?data=${opts.data}` : "";
    return `/runs/${runId}/arena/${opts?.firstPlay ?? 0}/forensic${q}`;
  }
  return screenHref(roleHomeScreen[role], runId, { data: opts?.data });
}

const KEY = "sx_role";
export function getRole(): Role {
  if (typeof window === "undefined") return "admin";
  const r = window.localStorage.getItem(KEY);
  return r === "admin" || r === "security" || r === "exec" || r === "compliance" ? r : "admin";
}
export function setRole(r: Role) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, r);
}
