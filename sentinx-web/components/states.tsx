import Link from "next/link";
import { Loader2, AlertTriangle } from "lucide-react";
import { Logo } from "./logo";

export function RunLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center text-ink-muted">
      <span className="inline-flex items-center gap-2 text-[13px]">
        <Loader2 className="h-4 w-4 animate-spin text-brand" strokeWidth={1.75} /> Loading run…
      </span>
    </main>
  );
}

export function RunError({ msg }: { msg: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-center">
      <Logo className="mb-2" />
      <AlertTriangle className="h-6 w-6 text-fail" strokeWidth={1.5} />
      <p className="text-[14px] font-medium text-ink">Could not load this run</p>
      <p className="mono text-[12px] text-ink-muted">{msg}</p>
      <Link href="/new" className="mt-2 text-[13px] text-brand hover:underline">Start a new audit</Link>
    </main>
  );
}
