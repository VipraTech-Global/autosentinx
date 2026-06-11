"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, Card, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || code.length < 3) {
      setError(true);
      return;
    }
    setSubmitting(true);
    setTimeout(() => router.push("/new"), 450);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="absolute right-5 top-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-5">
        <Card className="w-full max-w-[400px] p-7">
          <Logo className="mb-6" />
          <h1 className="text-[15px] font-semibold text-ink">Sign in to Sentinx</h1>
          <p className="mt-1 text-[13px] text-ink-muted">Access the red-team console.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="Work email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@nbfc.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(false);
                }}
                aria-invalid={error}
              />
            </Field>
            <Field label="Access code" htmlFor="code" hint="Demo access — provided by your Sentinx contact.">
              <Input
                id="code"
                type="password"
                placeholder="••••••"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                aria-invalid={error}
              />
            </Field>
            {error && (
              <p role="alert" className="text-[12.5px] text-fail-text">
                Enter a valid email and access code.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
      <footer className="px-5 py-4 text-center text-[11px] text-ink-faint">
        Proprietary &amp; confidential · © 2026 VipraTech Global
      </footer>
    </main>
  );
}
