"use client";

import { useId, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function Disclosure({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="rounded-md border border-border bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <ChevronRight
          className={cn("h-4 w-4 text-ink-faint transition-transform", open && "rotate-90")}
          strokeWidth={1.5}
        />
        <span className="text-[13px] font-medium text-ink">{title}</span>
        {count !== undefined && (
          <span className="ml-auto text-[12px] text-ink-faint tnum">{count}</span>
        )}
      </button>
      {open && (
        <div id={id} className="border-t border-border px-3 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
