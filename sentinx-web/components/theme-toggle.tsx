"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      // resolvedTheme is unknown on the server → gate the themed label on `mounted` (like the icon)
      // so SSR and first client render agree; specific label appears once mounted. (hydration-safe)
      aria-label={mounted ? (isDark ? "Switch to light theme" : "Switch to dark console theme") : "Toggle theme"}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border text-ink-muted hover:text-ink hover:border-brand/40 transition-colors",
        className,
      )}
    >
      {mounted ? (
        isDark ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
