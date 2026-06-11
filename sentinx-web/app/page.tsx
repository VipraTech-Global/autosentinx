import Link from "next/link";
import { ArrowRight, Radar, ShieldAlert, FileCheck2 } from "lucide-react";
import { MinimalBar } from "@/components/minimal-bar";
import { RadarMark } from "@/components/logo";

export default function Landing() {
  return (
    <main className="flex min-h-screen flex-col">
      <MinimalBar showSignIn />

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            <RadarMark className="h-3.5 w-3.5 text-brand" /> AI Red-Team &amp; Compliance Console
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Autonomous red-teaming for Hindi/Hinglish voice AI agents —{" "}
            <span className="text-brand">proof, not promises.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">
            Sentinx attacks your NBFC&apos;s voice collection agent with multi-turn Hinglish probes,
            then shows — with evidence — exactly where it holds and where it breaks, mapped to RBI,
            DPDP and security frameworks.
          </p>
          <div className="mt-7 flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-on-brand hover:bg-brand-strong"
            >
              Run an audit <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <span className="text-[12.5px] text-ink-faint">Sandbox target · synthetic data</span>
          </div>
        </div>

        <div className="mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
          <Proof icon={<Radar className="h-4 w-4" strokeWidth={1.5} />} title="Multi-turn Hinglish attacks">
            A self-growing library of adversarial plays drives real conversations against the agent.
          </Proof>
          <Proof icon={<ShieldAlert className="h-4 w-4" strokeWidth={1.5} />} title="Security + Compliance">
            Every finding graded by an independent judge panel and mapped to the exact regulation.
          </Proof>
          <Proof icon={<FileCheck2 className="h-4 w-4" strokeWidth={1.5} />} title="Evidence-backed">
            The agent&apos;s own words, the bypass signal, a forwardable findings report.
          </Proof>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-4">
        <div className="mx-auto max-w-6xl text-[11px] text-ink-faint">
          Proprietary &amp; confidential · © 2026 VipraTech Global · For authorised security testing only.
        </div>
      </footer>
    </main>
  );
}

function Proof({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-brand">{icon}</div>
      <h3 className="mt-2 text-[13.5px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
