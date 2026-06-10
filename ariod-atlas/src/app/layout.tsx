import type { Metadata } from "next";
import { Merriweather, Inter } from "next/font/google";
import "./globals.css";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Ariod Atlas",
  description: "Explore the world of plants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${merriweather.variable} ${inter.variable}`}>
      <body className="bg-background text-muted font-body antialiased">
        <div className="flex min-h-screen flex-col">
          {/* Top Navigation */}
          <header className="sticky top-0 z-50 border-b border-card/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
              {/* Brand */}
              <div className="text-xl font-heading text-primary tracking-tight">
                Ariod Atlas
              </div>
              {/* Nav Links */}
              <div className="flex items-center gap-8">
                <a className="text-sm font-medium text-heading transition hover:text-primary">
                  Explore
                </a>
                <a className="text-sm font-medium text-muted transition hover:text-primary">
                  Compare
                </a>
                <a className="text-sm font-medium text-muted transition hover:text-primary">
                  Learn
                </a>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-card/80 bg-card py-8">
            <div className="mx-auto max-w-7xl px-6">
              <p className="text-xs text-muted">
                &copy; 2026 Ariod Atlas. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}