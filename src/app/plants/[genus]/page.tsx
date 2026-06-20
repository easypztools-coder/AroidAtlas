import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import GenusPlantList from "@/components/GenusPlantList";

interface PlantSummary {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  rarityStatus: string;
  priceGuideTier: string;
  botanicalType: string;
}

interface PageProps {
  params: { genus: string };
}

const GENUS_DESCRIPTIONS: Record<string, string> = {
  philodendron: "Diverse neotropical climbers with striking foliage. Browse our collection of Philodendron species and cultivars.",
  anthurium: "Velvet-leafed jewels of the rainforest understory. Browse our collection of Anthurium species and cultivars.",
  monstera: "Iconic fenestrated giants of the tropical canopy. Browse our collection of Monstera species and cultivars.",
  alocasia: "Dramatic shield-leafed specimens from Southeast Asia. Browse our collection of Alocasia species and cultivars.",
  other: "Other rare climbing aroid genera including Amydrium, Rhaphidophora, Scindapsus, Epipremnum, Cercestis, and Pothos.",
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
      botanicalType: data.botanicalType || "variegated",
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
        <GenusPlantList initialPlants={plants} genus={genus} />
      )}
    </div>
  );
}
