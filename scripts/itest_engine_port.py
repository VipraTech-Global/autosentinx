"""Engine-port integration test (manual, not part of the unit suite).

Drives the FULL HTTP path against a running backend: signup -> /scan (low intensity)
-> /approve (background run vs the real Aarav target + Gemini) -> poll the NEW
GET /console/runs/{id}/runview endpoint until terminal -> validate the RunView the
frontend's fromStateJson consumes. Confirms Wave 1 (projection+endpoint), Wave 3
(intensity dial -> max_turns), and Wave 4 (recon persisted -> real ReconView).
"""
import sys
import time
import httpx

BASE = "http://127.0.0.1:8080"
TARGET = "https://aarav-api-793989842362.asia-south1.run.app"
EMAIL = "itest-engineport@autosentinx.local"
PW = "itest-pw-12345"
BUDGET = 2
MAX_TURNS = 3
INTENSITY = "low"
DEADLINE = 480  # seconds


def token() -> str:
    with httpx.Client(base_url=BASE, timeout=30) as c:
        r = c.post("/auth/login", json={"email": EMAIL, "password": PW})
        if r.status_code == 200:
            return r.json()["access_token"]
        r = c.post("/auth/signup", json={"email": EMAIL, "password": PW})
        r.raise_for_status()
        return r.json()["access_token"]


def main() -> int:
    tok = token()
    h = {"authorization": f"Bearer {tok}"}
    with httpx.Client(base_url=BASE, headers=h, timeout=60) as c:
        # 1) scan (intensity dial -> max_turns + budget, Wave 3)
        r = c.post("/scan", params={"target": TARGET, "strategy": "ucb", "budget": BUDGET,
                                    "max_turns": MAX_TURNS, "intensity": INTENSITY})
        r.raise_for_status()
        run_id = r.json()["run_id"]
        roe = r.json()["roe"]
        print(f"[scan] run_id={run_id}  roe.max_turns={roe.get('max_turns')}  roe.intensity={roe.get('intensity')}")
        assert roe.get("max_turns") == MAX_TURNS and roe.get("intensity") == INTENSITY, "dial not recorded in RoE"

        # 2) approve -> background run starts
        r = c.post(f"/runs/{run_id}/approve", params={"approver": "itest"})
        r.raise_for_status()
        print(f"[approve] status={r.json().get('status')}")

        # 3) poll the NEW runview endpoint until terminal (this is exactly what the live Arena does)
        t0 = time.time()
        rv = None
        last = None
        while time.time() - t0 < DEADLINE:
            r = c.get(f"/console/runs/{run_id}/runview")
            if r.status_code != 200:
                print(f"[poll] runview -> {r.status_code} {r.text[:160]}")
                return 2
            rv = r.json()
            snap = (rv["status"], rv["summary"]["done"], rv["summary"]["total"],
                    rv["summary"]["fails"], rv["summary"]["risks"], rv["recon"]["status"])
            if snap != last:
                print(f"[poll +{int(time.time()-t0):>3}s] status={snap[0]} done={snap[1]}/{snap[2]} "
                      f"fails={snap[3]} risks={snap[4]} recon={snap[5]}")
                last = snap
            if rv["status"] in ("done", "failed", "blocked"):
                break
            time.sleep(4)

        if rv is None:
            print("[FAIL] never got a runview")
            return 2

        # 4) validate the RunView contract the FE consumes
        print("\n=== FINAL RUNVIEW VALIDATION ===")
        ok = True

        def check(label, cond, extra=""):
            nonlocal ok
            print(f"  {'PASS' if cond else 'FAIL'}  {label}{(' — ' + extra) if extra else ''}")
            ok = ok and cond

        check("run reached terminal", rv["status"] in ("done", "failed"), rv["status"])
        check("engine.maxTurns is the dialed int", rv["engine"]["maxTurns"] == MAX_TURNS, str(rv["engine"]["maxTurns"]))
        check("intensity echoed", rv.get("intensity") == INTENSITY, str(rv.get("intensity")))
        plays = rv.get("plays", [])
        check("plays present", len(plays) >= 1, f"{len(plays)} plays")
        graded = [p for p in plays if p["status"] == "done"]
        check("at least one graded play", len(graded) >= 1, f"{len(graded)} graded")
        # turn-level + verdict shape on a graded play
        if graded:
            p = graded[0]
            check("graded play has turns", len(p["turns"]) >= 1, f"{len(p['turns'])} turns")
            check("graded play verdict has productOutcome",
                  p["verdict"].get("productOutcome") in ("FAIL", "RISK", "PASS"),
                  str(p["verdict"].get("productOutcome")))
            check("verdict nJudges is real (not hardcoded)",
                  isinstance(p["verdict"].get("nJudges"), int), str(p["verdict"].get("nJudges")))
            check("persona is prose not slug", "-" not in (p.get("persona") or "x"), p.get("persona"))
            reg = p.get("regulation") or []
            check("regulation snake_case", (not reg) or set(reg[0]) == {"framework", "control_id", "control_title"},
                  str(reg[0]) if reg else "none")
        # Wave 4 recon — honest contract: either probed (done + profile + steps) or skipped (with a reason)
        rc = rv["recon"]
        check("recon persisted + honest status", rc["status"] in ("done", "skipped"), rc["status"])
        if rc["status"] == "done":
            check("recon(done) has a profile", isinstance(rc.get("profile"), dict))
            check("recon(done) has steps[] transcript", len(rc.get("steps") or []) >= 1, f"{len(rc.get('steps') or [])} steps")
        else:
            check("recon(skipped) has a reason (not a hollow profile)", bool(rc.get("reason")), rc.get("reason"))
        # no fabricated verdicts on degraded plays
        for p in plays:
            if p["status"] in ("error", "blocked"):
                check(f"degraded play '{p['id']}' not counted as assessed",
                      p["verdict"]["productOutcome"] in ("ERROR", "BLOCKED"))

        print(f"\n{'>>> INTEGRATION TEST PASS' if ok else '>>> INTEGRATION TEST FAIL'}  (run {run_id}, {rv['status']})")
        return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
