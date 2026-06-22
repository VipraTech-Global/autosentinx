import Link from "next/link";
import { MinimalBar } from "@/components/minimal-bar";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col">
      <MinimalBar />
      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <span className="mono text-[13px] text-ink-faint">404</span>
        <h1 className="mt-2 text-xl font-semibold text-ink">Not found</h1>
        <p className="mt-1 max-w-sm text-[13px] text-ink-muted">
          This run or observation doesn&apos;t exist. Pick one from your runs, or start a new audit.
        </p>
        <div className="mt-5 flex gap-2">
          <Link href="/new" className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-strong">
            New audit
          </Link>
          <Link href="/runs" className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm text-ink-muted hover:text-ink">
            Your runs
          </Link>
          <Link href="/" className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm text-ink-muted hover:text-ink">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
