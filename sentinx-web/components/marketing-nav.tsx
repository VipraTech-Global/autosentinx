"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "#platform", label: "Platform" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

/** Landing header — transparent over the hero, frosts + adds a hairline once scrolled. */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled
          ? "border-b border-border bg-surface/70 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center px-5">
        <Link href="/" aria-label="AutoSentinx home">
          <Logo />
        </Link>

        <nav className="ml-8 hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[13.5px] text-ink-muted hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="hidden text-[13.5px] text-ink-muted hover:text-ink sm:block">
            Sign in
          </Link>
          <Link href="/login" className="btn-cta">
            Run an audit
          </Link>
        </div>
      </div>
    </header>
  );
}
