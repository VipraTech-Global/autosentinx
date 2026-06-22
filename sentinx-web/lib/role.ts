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

// Server-side role-based access control is NOT yet implemented (backend RBAC is deferred — see
// `design documentation/live-views/PERSONA-NAV-MODEL.md` for each persona's intended nav paths).
// Until it lands, EVERY logged-in user can open EVERY screen; the role is a client-side "viewing as"
// convenience that drives only WHERE a persona LANDS, not what they may access. Flip RBAC_ENFORCED
// to true (and enforce it server-side) to switch on the documented per-persona restrictions.
export const RBAC_ENFORCED = false;

/** May this role see the live duel (V2 Arena / V3 Forensic)? Open to everyone until RBAC lands
 *  (user, 2026-06-21). The intended restriction — Admin/QA + Security only (D-LV27) — is preserved
 *  behind RBAC_ENFORCED and documented in PERSONA-NAV-MODEL.md. */
export const canSeeLive = (role: Role) => !RBAC_ENFORCED || role === "admin" || role === "security";

/** Each role's home SCREEN (personas §ownership: Admin→Arena, Security→Forensic, Exec→Overview, Compliance→Findings). */
export const roleHomeScreen: Record<Role, RunScreen> = {
  admin: "live",
  security: "live", // Security owns Forensic → Live, opened at Detail (handled by the caller)
  exec: "overview",
  compliance: "findings",
};

/** Build the route for an in-run screen. Real runs are always engine-backed (the live duel reads
 *  the server RunView), so no source param is threaded — the canned demos live on /canned-examples. */
export function screenHref(screen: RunScreen, runId: string): string {
  switch (screen) {
    case "overview": return `/runs/${runId}`;
    case "findings": return `/runs/${runId}/findings`;
    case "report": return `/runs/${runId}/report`;
    case "processing": return `/runs/${runId}/processing`;
    case "live": return `/runs/${runId}/arena`;
  }
}

/** Where a role lands when picked. Security opens a play's Forensic (firstPlay resolved by the
 *  caller to a real, started play); everyone else lands on their home screen. */
export function roleHref(role: Role, runId: string, opts?: { firstPlay?: number }): string {
  if (role === "security") return `/runs/${runId}/arena/${opts?.firstPlay ?? 0}/forensic`;
  return screenHref(roleHomeScreen[role], runId);
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
