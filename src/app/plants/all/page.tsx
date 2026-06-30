import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import PlantCatalog, { type CatalogPlant } from "@/components/PlantCatalog";

export const metadata: Metadata = {
  title: "Full Plant Catalog — All 281 Species & Cultivars | Aroid Atlas",
  description:
    "Search and filter our full catalog of rare aroid species and cultivars by genus, rarity status, and live market status. Detailed profiles with eBay UK price tracking.",
  alternates: {
    canonical: "https://aroidatlas.co.uk/plants/all",
  },
};

const GENUS_LABELS: Record<string, string> = {
  monstera: "Monstera",
  philodendron: "Philodendron",
  anthurium: "Anthurium",
  alocasia: "Alocasia",
  begonia: "Begonia",
  other: "Other",
};

function getAllPlants(): CatalogPlant[] {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  if (!fs.existsSync(plantsRoot)) return [];

  const genera = fs.readdirSync(plantsRoot).filter((f) =>
    fs.statSync(path.join(plantsRoot, f)).isDirectory()
  );

  const results: CatalogPlant[] = [];

  for (const genusDir of genera) {
    const dirPath = path.join(plantsRoot, genusDir);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const raw = fs.readFileSync(path.join(dirPath, file), "utf-8");
      const data = JSON.parse(raw);
      results.push({
        slug: data.slug,
        name: data.name,
        scientificName: data.scientificName,
        commonName: data.commonName,
        genus: genusDir,
        genusLabel: GENUS_LABELS[genusDir] ?? genusDir,
        rarityStatus: data.rarityStatus,
        priceGuideTier: data.priceGuideTier,
        botanicalType: data.botanicalType || "variegated",
        marketStatus: data.marketMetrics?.marketStatus ?? null,
        currentMedianPriceGBP: data.marketMetrics?.currentMedianPriceGBP ?? null,
      });
    }
  }

  return results.sort((a, b) => a.scientificName.localeCompare(b.scientificName));
}

export default function AllPlantsPage() {
  const plants = getAllPlants();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Full Plant Catalog on Aroid Atlas",
    url: "https://aroidatlas.co.uk/plants/all",
    numberOfItems: plants.length,
  };

  return (
    <div className="section-container py-16 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="flex items-center gap-2 text-xs text-muted mb-8">
        <Link href="/plants" className="hover:text-primary transition-all duration-300 ease-in-out hover:-translate-y-0.5">
          Species
        </Link>
        <span>/</span>
        <span className="text-heading">Full Catalog</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
        Full Plant Catalog
      </h1>
      <p className="text-sm md:text-base leading-relaxed text-muted max-w-2xl mb-12">
        Browse and filter all {plants.length} species and cultivars in the Aroid Atlas directory by genus,
        rarity status, and live market status.
      </p>

      <PlantCatalog plants={plants} />
    </div>
  );
}
