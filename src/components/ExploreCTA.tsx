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
        <div className="glass-card-glow overflow-hidden rounded-3xl p-8 md:p-10 text-center">
          <h2 className="section-heading">Explore the Full Database</h2>
          <p className="section-subheading mt-3 mx-auto max-w-xl">
            Browse {speciesCount || ""}species across Monstera, Philodendron, Anthurium, Alocasia and beyond — with live eBay UK market prices.
          </p>
          <div className="mt-6">
            <Link
              href="/plants"
              className="btn-primary inline-flex items-center gap-2"
            >
              Browse All Species
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
