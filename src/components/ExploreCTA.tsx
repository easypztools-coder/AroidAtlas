"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ExploreCTA() {
  const [speciesCount, setSpeciesCount] = useState<string>("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.species) {
          setSpeciesCount(`${d.species} `);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative section-spacing">
      <div className="section-container">
        {/* Full-width brass rule above */}
        <div className="mb-12 h-px w-full bg-border/40" />

        <div className="text-center">
          {/* Eyebrow */}
          <div className="mb-5 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-accent/50" />
            <p className="font-body text-xs font-semibold tracking-wider uppercase text-accent">
              The Full Directory
            </p>
            <div className="h-px w-10 bg-accent/50" />
          </div>

          <h2 className="font-heading text-3xl font-semibold text-heading md:text-4xl">
            Explore the Full Database
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
            Browse {speciesCount || ""}species across Monstera, Philodendron, Anthurium, Alocasia and beyond — with live eBay UK market prices and value estimates.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/plants" className="btn-primary">
              Browse All Species
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="/compare" className="text-sm font-medium text-muted underline underline-offset-4 transition-all duration-300 ease-in-out hover:text-heading hover:-translate-y-0.5">
              Compare specimens
            </Link>
          </div>
        </div>

        {/* Full-width brass rule below */}
        <div className="mt-12 h-px w-full bg-border/40" />
      </div>
    </section>
  );
}
