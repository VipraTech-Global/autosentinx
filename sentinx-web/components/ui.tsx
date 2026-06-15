import { cn } from "@/lib/cn";
import * as React from "react";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
  const sizes = { sm: "h-9 px-3 text-[13px]", md: "h-11 px-4 text-sm" }[size];
  const variants = {
    primary: "bg-brand text-on-brand hover:bg-brand-strong",
    secondary: "border border-border bg-surface text-ink hover:border-brand/50 hover:text-brand",
    ghost: "text-ink-muted hover:text-ink hover:bg-surface-sunk",
    danger: "bg-fail text-white hover:opacity-90",
  }[variant];
  return <button className={cn(base, sizes, variants, className)} {...props} />;
}

export function Card({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-surface", className)}
      style={{ boxShadow: "var(--shadow-elev)", ...style }}
      {...props}
    />
  );
}

export function SectionLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("text-[11px] font-semibold uppercase tracking-wider text-ink-faint", className)}>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-[13px] font-medium text-ink mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-ink-muted mt-1.5">{hint}</span>}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-11 rounded-sm border border-border bg-surface px-3 text-sm text-ink",
          "placeholder:text-ink-faint focus-visible:border-brand outline-none transition-colors",
          "aria-invalid:border-fail-text aria-invalid:focus-visible:border-fail-text",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[5rem] rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink",
          "placeholder:text-ink-faint focus-visible:border-brand outline-none transition-colors",
          "aria-invalid:border-fail-text aria-invalid:focus-visible:border-fail-text",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Mono({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("mono text-[12.5px]", className)}>{children}</span>;
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
