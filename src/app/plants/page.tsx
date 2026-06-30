import type { Metadata } from "next";
import Link from "next/link";
import { genera } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Explore Aroids by Genus",
  description:
    "Browse thousands of aroid species across Monstera, Philodendron, Anthurium, Alocasia and more. Detailed profiles with live eBay UK market data.",
};

export default function PlantsPage() {
  return (
    <div className="section-container py-16 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading">
          Explore Aroids by Genus
        </h1>
        <Link href="/plants/all" className="btn-secondary">
          Browse Full Catalog
        </Link>
      </div>
      <p className="text-sm md:text-base leading-relaxed text-muted max-w-2xl mb-12">
        Select a genus below to browse species profiles, care data, and live market prices — or browse the
        full catalog with genus, rarity, and market filters.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {genera.map((genus) => (
          <Link
            key={genus.slug}
            href={`/plants/${genus.slug}`}
            className="glass-card-hover group relative flex flex-col overflow-hidden rounded-2xl p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-forest-deep via-card to-forest-dark opacity-50" />
            <div className="relative">
              <h2 className="text-lg font-heading font-bold text-heading group-hover:text-primary transition-colors duration-300">
                {genus.name}
              </h2>
              <p className="mt-1 text-xs text-muted line-clamp-2">{genus.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="badge-primary">{genus.speciesCount} species</span>
                <svg
                  className="h-4 w-4 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}