import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import PlantCatalog, { type CatalogPlant } from "@/components/PlantCatalog";

export const metadata: Metadata = {
  title: "Plant Catalog — All Species & Cultivars | Aroid Atlas",
  description:
    "Search and filter our full catalog of rare aroid species and cultivars by genus, rarity status, and live market status. Detailed profiles with eBay UK price tracking.",
  alternates: {
    canonical: "https://aroidatlas.co.uk/catalog",
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
        contentTier: data.contentTier === "sketch" ? "sketch" : "plate",
        marketStatus: data.marketMetrics?.marketStatus ?? null,
        currentMedianPriceGBP: data.marketMetrics?.currentMedianPriceGBP ?? null,
      });
    }
  }

  return results.sort((a, b) => a.scientificName.localeCompare(b.scientificName));
}

interface PageProps {
  searchParams: { search?: string; genus?: string };
}

export default function CatalogPage({ searchParams }: PageProps) {
  const plants = getAllPlants();
  const initialSearch = searchParams.search ?? "";
  const initialGenus = searchParams.genus ?? "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Full Plant Catalog on Aroid Atlas",
    url: "https://aroidatlas.co.uk/catalog",
    numberOfItems: plants.length,
  };

  return (
    <div className="section-container py-16 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="flex items-center gap-2 text-xs text-muted mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary transition-colors duration-150">Home</Link>
        <span className="text-border-strong">/</span>
        <span className="text-heading">Catalog</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-3">
        Plant Catalog
      </h1>
      <p className="text-sm md:text-base leading-relaxed text-muted max-w-2xl mb-10">
        Browse all {plants.length} species and cultivars. Filter by genus, rarity, and live market
        status — or search by name.
      </p>

      <PlantCatalog
        plants={plants}
        initialSearch={initialSearch}
        initialGenus={initialGenus}
      />
    </div>
  );
}
