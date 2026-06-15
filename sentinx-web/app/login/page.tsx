"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, Card, Field, Input } from "@/components/ui";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Enter a valid email and a password (8+ characters).");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || code.length < 8) {
      setErrorMsg("Enter a valid email and a password (8+ characters).");
      setError(true);
      return;
    }
    setSubmitting(true);
    try {
      await login(email, code); // logs in, or creates the account on first use
      router.push("/new");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Sign-in failed.");
      setError(true);
      setSubmitting(false);
    }
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
          <p className="mt-1 text-[13px] text-ink-muted">Security &amp; compliance audit console.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="Work email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoFocus
                autoComplete="username"
                placeholder="you@nbfc.in"
                value={email}
                readOnly={submitting}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(false);
                }}
                aria-invalid={error}
                aria-describedby={error ? "login-error" : undefined}
              />
            </Field>
            <Field label="Password" htmlFor="code" hint="8+ characters. First sign-in creates your operator account.">
              <Input
                id="code"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={code}
                readOnly={submitting}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                aria-invalid={error}
                aria-describedby={error ? "login-error" : undefined}
              />
            </Field>
            {error && (
              <p
                id="login-error"
                role="alert"
                aria-live="polite"
                className="flex items-start gap-1.5 text-[12.5px] text-fail-text"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
                {errorMsg}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
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
