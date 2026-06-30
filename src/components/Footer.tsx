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
    <footer className="relative border-t border-border/30 bg-background-soft">
      {/* Fine brass accent rule */}
      <div className="h-px w-full bg-accent/15" />

      <div className="section-container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 md:gap-12">

          {/* ── Brand Column ─────────────────────────────────────── */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="group mb-4 inline-flex items-center gap-2.5">
              {/* Replace with final AroidAtlas circular logo asset. */}
              <div className="relative h-10 w-10 shrink-0">
                <Image
                  src="/images/aroidatlas-emblem-transparent-tight.png"
                  alt="Aroid Atlas"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="relative pb-0.5 font-heading text-sm font-bold tracking-[0.12em] text-heading">
                  <span className="text-accent transition-colors duration-150 group-hover:text-accent-muted">A</span>ROID{" "}
                  <span className="text-accent transition-colors duration-150 group-hover:text-accent-muted">A</span>TLAS
                  <span className="absolute bottom-0 left-0 h-[1px] w-full bg-accent/20 origin-left transform scale-x-100 transition-all duration-300 group-hover:bg-accent group-hover:scale-x-105" />
                </span>
                <span className="mt-1 font-body text-[8px] tracking-[0.22em] text-accent">
                  .CO.UK
                </span>
              </div>
            </Link>
            <p className="max-w-[200px] text-xs leading-relaxed text-muted">
              A curated directory of rare aroids, market values and collector reference data.
            </p>
          </div>

          {/* ── Link Columns ─────────────────────────────────────── */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-heading">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted transition-all duration-300 ease-in-out hover:text-heading"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom Bar ───────────────────────────────────────── */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/30 pt-6 sm:flex-row sm:items-center">
          <p className="text-[11px] text-muted/60">
            &copy; {new Date().getFullYear()} Aroid Atlas. All rights reserved.
          </p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-accent/70">
            Rare Plant Directory &middot; Value Index &middot; .CO.UK
          </p>
        </div>
      </div>
    </footer>
  );
}
