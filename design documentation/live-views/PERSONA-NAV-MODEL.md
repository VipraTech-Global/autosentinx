# Persona navigation model — intended per-role nav (UNRESOLVED until backend RBAC)

Status: **OPEN / deferred.** Date noted: 2026-06-21 (user decision).

## Decision

For now, **every logged-in user can open every screen.** The persona "role" is a client-side
*viewing-as* convenience (localStorage `sx_role`, default `admin`) that controls only **where a
persona lands by default**, not what they may access. There is **no server-side authorization** on
who may view the live duel or approve a run.

This is intentional and temporary. The intended per-persona restrictions below are **captured here
and pre-wired in code behind a single flag** so they can be switched on the moment the backend gains
real role-based access control (RBAC). Until then this is an unresolved item — do **not** treat the
current open-access behaviour as the final product.

### How it is wired today

- `lib/role.ts` → `export const RBAC_ENFORCED = false`. Flipping it to `true` re-applies the
  documented `canSeeLive` restriction (Admin/QA + Security only) across the Live tab, the Arena and
  the Forensic pages — which already call `canSeeLive(role)` for their access gate.
- `roleHomeScreen` + `roleHref()` already encode each persona's home screen; the post-approve flow
  (`new/page.tsx`, `processing-view.tsx`) and the `/runs` index row-click already land each persona
  on their home.
- **What is still missing (the unresolved work):** the `canSeeLive` / approve checks must move
  **server-side** (FastAPI `current_user` carries no role today — `security.py` validates only the
  bearer token + `is_active`). A client-side flag is not a security boundary. See
  `ENGINE-PORT-PLAN.md` → deferred "server-side RBAC".

## Per-persona nav model (to enforce once RBAC lands)

| Persona | Role id | Home screen | Owns | Live duel (Arena/Forensic) | Intended reachable screens |
|---|---|---|---|---|---|
| Priya — Admin / QA | `admin` | **Live Arena** (V2) | the run end-to-end | ✅ yes | Arena, Forensic, Overview, Findings, Report, Runs index |
| Arjun — Security | `security` | **Forensic** (V3), opened at the first started play | attack forensics | ✅ yes | Forensic, Arena, Overview, Findings, Report, Runs index |
| Ishaan — Exec | `exec` | **Overview** | exec summary | ❌ no (D-LV27) | Overview, Findings, Report, Runs index |
| Meera — Compliance | `compliance` | **Findings** | findings & report | ❌ no (D-LV27) | Findings, Overview, Report, Runs index |

Landing rules (already implemented as the default-landing layer; become hard rules under RBAC):

- **After Approve:** Admin/Security → live Arena (`/runs/{id}/arena`); Compliance → Findings; Exec/other → Overview.
- **From the `/runs` index:** a row routes to the persona's home (Admin/Security → Arena; Compliance → Findings; Exec → Overview); a `pendingApproval` run routes to the run page.
- **Security's Forensic entry** resolves to the first *started* play (`firstPlayIdx`), not a hardcoded play 0.

## Open questions to resolve when RBAC is built

1. Where does the role come from — a real claim on the JWT / user record, or a per-run assignment?
2. Should Exec/Compliance get **read-only** Live access (a softer relaxation than full block), per the demo-time option the user left open?
3. Server-side enforcement points: `GET /console/runs/{id}/runview` (Live), `POST /runs/{id}/approve` (approval), and any per-audience anonymization (`audience=customer`, currently dead code).
