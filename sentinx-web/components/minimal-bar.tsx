import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function MinimalBar({ showSignIn = false }: { showSignIn?: boolean }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-5 py-2.5">
        <Link href="/" aria-label="AutoSentinx home">
          <Logo />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {showSignIn && (
            <Link href="/login" className="text-[13px] text-ink-muted hover:text-ink">
              Sign in
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
