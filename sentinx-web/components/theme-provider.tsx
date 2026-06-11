"use client";

import { ThemeProvider as NextThemes } from "next-themes";

// Light is the default first impression (D-Q6); dark is a first-class toggle.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemes>
  );
}
