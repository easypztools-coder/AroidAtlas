import type { Metadata } from "next";
import { Merriweather, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  description:
    "The visual encyclopedia of rare tropical plants. Discover, explore and compare the world's most extraordinary aroids.",
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
          <Navbar />

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          <Footer />
        </div>
      </body>
    </html>
  );
}
