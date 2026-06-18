import { cn } from "@/lib/cn";

/** Radar / scan-sweep sentinel mark (D-Q18) — concentric arcs + sweep line. */
export function RadarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-6 w-6", className)} aria-hidden="true" fill="none">
      {/* concentric arcs */}
      <path d="M12 4.5 A7.5 7.5 0 0 1 19.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <path d="M12 7.8 A4.2 4.2 0 0 1 16.2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      {/* sweep line */}
      <path d="M12 12 L21 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* center */}
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  showWord = true,
}: {
  className?: string;
  markClassName?: string;
  showWord?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      <RadarMark className={cn("text-brand", markClassName)} />
      {showWord && (
        <span className="font-semibold tracking-tight text-ink text-[15px]">
          AutoSentin<span className="text-brand">X</span>
        </span>
      )}
    </span>
  );
}
