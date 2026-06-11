"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-strong"
    >
      <Printer className="h-4 w-4" strokeWidth={1.75} /> Print / Save as PDF
    </button>
  );
}
