import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientLogger } from "@/components/client-logger";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoDeva = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
});
// Display face for the marketing landing headings (variable font).
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoSentinx — AI Red-Team Console",
  description:
    "Autonomous red-teaming for Hindi/Hinglish voice AI agents — proof, not promises.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoDeva.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <ThemeProvider>
          <ClientLogger />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
