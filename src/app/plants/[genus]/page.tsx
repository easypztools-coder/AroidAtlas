import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import fs from "fs";
import path from "path";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";

interface PlantSummary {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  rarityStatus: string;
  priceGuideTier: string;
}

interface PageProps {
  params: { genus: string };
}

const GENUS_DESCRIPTIONS: Record<string, string> = {
  philodendron: "Diverse neotropical climbers with striking foliage. Browse our collection of Philodendron species and cultivars.",
  anthurium: "Velvet-leafed jewels of the rainforest understory. Browse our collection of Anthurium species and cultivars.",
  monstera: "Iconic fenestrated giants of the tropical canopy. Browse our collection of Monstera species and cultivars.",
  alocasia: "Dramatic shield-leafed specimens from Southeast Asia. Browse our collection of Alocasia species and cultivars.",
  rhaphidophora: "Understory shinglers and climbers with fenestrated leaves. Browse our collection of Rhaphidophora species and cultivars.",
  scindapsus: "Vining climbing aroids with satin texture and silver patterns. Browse our collection of Scindapsus species and cultivars.",
};

function getAllPlantsForGenus(genus: string): PlantSummary[] {
  const dirPath = path.join(process.cwd(), "content", "plants", genus.toLowerCase());
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const genusCapitalized = params.genus.charAt(0).toUpperCase() + params.genus.slice(1).toLowerCase();
  return {
    title: `${genusCapitalized} Species — Neotropical Climbing Aroids`,
    description: `Browse ${genusCapitalized} species and cultivars with detailed care profiles and live eBay UK price tracking.`,
  };
}

export function generateStaticParams() {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  if (!fs.existsSync(plantsRoot)) return [];
  const folders = fs.readdirSync(plantsRoot).filter((f) => {
    return fs.statSync(path.join(plantsRoot, f)).isDirectory();
  });
  return folders.map((genus) => ({ genus }));
}

export default function GenusPage({ params }: PageProps) {
  const genus = params.genus.toLowerCase();
  const genusCapitalized = params.genus.charAt(0).toUpperCase() + params.genus.slice(1).toLowerCase();
  const plants = getAllPlantsForGenus(genus);
  const description = GENUS_DESCRIPTIONS[genus] || `Browse our collection of ${genusCapitalized} species and cultivars.`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <nav className="flex items-center gap-2 text-xs text-muted mb-8">
        <Link href="/plants" className="hover:text-primary transition-colors">Species</Link>
        <span>/</span>
        <span className="text-heading">{genusCapitalized}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
        {genusCapitalized}
      </h1>
      <p className="text-sm md:text-base text-muted max-w-2xl mb-12">
        {description}
      </p>

      {plants.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted">No {genusCapitalized} species data available yet.</p>
          <Link href="/plants" className="btn-primary mt-6 inline-flex">Browse All Genera</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <Link
              key={plant.slug}
              href={`/plants/${genus}/${plant.slug}`}
              className="glass-card-hover group relative flex overflow-hidden rounded-2xl p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-forest-deep via-card to-forest-dark opacity-50" />
              <div className="relative flex justify-between items-center w-full gap-4 z-10">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-heading font-bold text-heading italic group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {plant.scientificName}
                  </h3>
                  <p className="mt-1 text-xs text-muted truncate">{plant.commonName}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="badge-price">{plant.priceGuideTier} · {getStaticTierLabel(plant.priceGuideTier)}</span>
                  </div>
                </div>
                
                {/* Right-aligned soft-reveal thumbnail */}
                <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-card border border-primary/5">
                  <Image
                    src={`/api/plant-image?genus=${genus}&slug=${plant.slug}`}
                    alt={plant.commonName}
                    fill
                    className="object-cover object-center scale-[1.3] transition-all duration-500 ease-out group-hover:scale-[1.4] opacity-90 group-hover:opacity-100"
                    sizes="80px"
                  />
                  {/* Spotlight overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(17,26,21,0.8)_80%,#111A15_100%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
