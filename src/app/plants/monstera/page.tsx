import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";

export const metadata: Metadata = {
  title: "Monstera Species — Iconic Fenestrated Aroids",
  description:
    "Browse Monstera species and cultivars with detailed profiles, morphology data, and live eBay UK price tracking. Deliciosa, Thai Constellation, Albo and more.",
};

interface PlantSummary {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  rarityStatus: string;
  priceGuideTier: string;
}

function getAllMonsteraPlants(): PlantSummary[] {
  const dirPath = path.join(process.cwd(), "content", "plants", "monstera");
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(dirPath, f), "utf-8");
    const data = JSON.parse(raw);
    return {
      slug: data.slug,
      name: data.name,
      scientificName: data.scientificName,
      commonName: data.commonName,
      rarityStatus: data.rarityStatus,
      priceGuideTier: data.priceGuideTier,
    };
  });
}

export default function MonsteraPage() {
  const plants = getAllMonsteraPlants();

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <nav className="flex items-center gap-2 text-xs text-muted mb-8">
        <Link href="/plants" className="hover:text-primary transition-colors">Species</Link>
        <span>/</span>
        <span className="text-heading">Monstera</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
        Monstera
      </h1>
      <p className="text-sm md:text-base text-muted max-w-2xl mb-12">
        Iconic fenestrated giants of the tropical canopy. Browse our collection of Monstera species and cultivars.
      </p>

      {plants.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted">No Monstera species data available yet.</p>
          <Link href="/plants" className="btn-primary mt-6 inline-flex">Browse All Genera</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <Link
              key={plant.slug}
              href={`/plants/monstera/${plant.slug}`}
              className="glass-card-hover group relative flex flex-col overflow-hidden rounded-2xl p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-forest-deep via-card to-forest-dark opacity-50" />
              <div className="relative">
                <h3 className="text-lg font-heading font-bold text-heading italic group-hover:text-primary transition-colors duration-300">
                  {plant.scientificName}
                </h3>
                <p className="mt-1 text-xs text-muted">{plant.commonName}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="badge-price">{plant.priceGuideTier} · {getStaticTierLabel(plant.priceGuideTier)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}