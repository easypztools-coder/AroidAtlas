"use client";

import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  explore: {
    title: "Explore",
    links: [
      { label: "Species Database", href: "/plants" },
      { label: "Genera", href: "/plants" },
      { label: "Compare Tool", href: "/compare" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Care Guides", href: "/learn" },
      { label: "Identification", href: "/identify" },
      { label: "Price Data", href: "/learn" },
      { label: "Glossary", href: "/learn" },
    ],
  },
  about: {
    title: "About",
    links: [
      { label: "Mission", href: "/about" },
      { label: "Methodology", href: "/about" },
      { label: "Contributors", href: "/about" },
      { label: "Contact", href: "/about" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/privacy" },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="relative border-t border-primary/10 bg-gradient-to-b from-background to-forest-dark">
      <div className="section-container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-3">
              <Image
                src="/images/logo.png"
                alt="Aroid Atlas"
                width={450}
                height={67}
                className="h-9 w-auto mix-blend-screen"
              />
            </Link>
            <p className="text-xs text-muted leading-relaxed max-w-xs">
              The definitive visual encyclopedia of rare tropical plants.
            </p>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-heading uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted transition-colors duration-200 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-primary/5">
          <p className="text-[11px] text-muted/60">
            &copy; {new Date().getFullYear()} Aroid Atlas. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
