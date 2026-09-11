import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf8f2",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://folicfree.com"),
  title: {
    default: "FolicFree — Find food without added folic acid",
    template: "%s — FolicFree",
  },
  description:
    "UK folic-acid food checker and meal builder. From 13 December 2026 non-wholemeal wheat flour is fortified — find the breads, brands and whole foods that aren't, and build cheaper, better meals.",
  openGraph: {
    siteName: "FolicFree",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <header className="fixed inset-x-0 top-0 z-40">
          <div className="mx-auto mt-3 max-w-6xl px-4">
            <div className="rounded-2xl border border-stone-200 bg-white/85 px-4 py-2.5 shadow-[0_16px_40px_-28px_#26251f59] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <a href="/" className="group flex items-center gap-2.5">
                  <span className="relative inline-flex h-3.5 w-3.5">
                    <span className="absolute inset-0 rounded-full bg-emerald-400" />
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40 [animation-duration:2.5s]" />
                  </span>
                  <span className="display text-xl">FolicFree</span>
                </a>
                <nav className="ml-auto flex items-center gap-0.5">
                  <a className="nav-link nav-pill" href="/build">Meal builder</a>
                  <a className="nav-link nav-pill" href="/list">Shopping list</a>
                  <a className="nav-link nav-pill" href="/brands">Clean Brands</a>
                  <a className="nav-link nav-pill" href="/submit">Suggest a Food</a>
                </nav>
              </div>
            </div>
          </div>
        </header>
        <div className="pt-24">{children}</div>
        <footer className="mt-3 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="accent-line mb-10" />
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="text-center">
                <p className="display text-2xl">FolicFree</p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[color:var(--ink-dim)]">
                  A free public utility. No accounts, no tracking cookies, no data selling.
                  Meal shares are encoded in the URL — nothing about you is stored.
                </p>
              </div>
              <div className="text-center text-xs leading-relaxed text-[color:var(--ink-faint)]">
                <p>
                  UK fortification facts: non-wholemeal wheat flour must be fortified with folic
                  acid from 13 Dec 2026 (FSA).
                </p>
              </div>
            </div>
            <p className="mt-10 text-center text-xs text-[color:var(--ink-faint)]">© 2026 FolicFree. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

