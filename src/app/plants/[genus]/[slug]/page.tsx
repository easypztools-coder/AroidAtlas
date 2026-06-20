import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import PlantDetailPage from "@/components/PlantDetailPage";

interface PricePoint {
  date: string;
  medianPriceGBP: number;
  dataPointsAnalyzed: number;
}

interface RecommendedPlant {
  name: string;
  slug: string;
  rarity: string;
  price: string;
}

interface QuickFacts {
  growthHabit: string;
  matureSize: string;
  light: string;
  humidity: string;
  temperature: string;
  difficulty: string;
  growthSpeed: string;
}

interface Morphology {
  leafShape: string;
  leafLength: string;
  leafWidth: string;
  petioleColor: string;
  venation: string;
  texture: string;
  variegation: string;
  growthHabit: string;
}

interface PlantData {
  name: string;
  slug: string;
  scientificName: string;
  commonName: string;
  statusTag: string;
  botanicalType: string;
  family: string;
  genus: string;
  species: string;
  origin: string;
  collectorPopularity: number;
  rarityStatus: string;
  availability: string;
  priceGuideTier: string;
  aboutText: string;
  quickFacts: QuickFacts;
  morphology: Morphology;
  marketMetrics: {
    currentMedianPriceGBP: number | null;
    threeMonthChangePercent: number | null;
    marketStatus: string | null;
  };
  priceHistory?: PricePoint[];
  recommendedPlants: RecommendedPlant[];
}

function loadPlantData(genus: string, slug: string): PlantData | null {
  try {
    const filePath = path.join(
      process.cwd(),
      "content",
      "plants",
      genus.toLowerCase(),
      `${slug}.json`
    );
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as PlantData;
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  const params: { genus: string; slug: string }[] = [];

  if (fs.existsSync(plantsRoot)) {
    const folders = fs.readdirSync(plantsRoot).filter((f) => {
      return fs.statSync(path.join(plantsRoot, f)).isDirectory();
    });

    for (const genus of folders) {
      const dirPath = path.join(plantsRoot, genus);
      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));

      for (const file of files) {
        params.push({
          genus,
          slug: file.replace(".json", ""),
        });
      }
    }
  }

  return params;
}

interface PageProps {
  params: { genus: string; slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genus, slug } = params;
  const data = loadPlantData(genus, slug);
  if (!data) return { title: "Plant Not Found" };

  return {
    title: `${data.scientificName} — ${data.commonName}`,
    description: data.aboutText.slice(0, 155) + "…",
    openGraph: {
      title: `${data.scientificName} | Ariod Atlas`,
      description: data.aboutText.slice(0, 155) + "…",
      images: [
        {
          url: `/api/plant-image?genus=${genus.toLowerCase()}&slug=${data.slug}`,
          alt: data.scientificName,
        },
      ],
    },
  };
}

export default function PlantPage({ params }: PageProps) {
  const { genus, slug } = params;
  const data = loadPlantData(genus, slug);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-lg font-heading font-bold text-heading">Plant Not Found</p>
          <p className="mt-2 text-sm text-muted">No data available for &ldquo;{slug}&rdquo;</p>
          <Link
            href="/plants"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-background transition hover:bg-primary/90"
          >
            Back to Species
          </Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    name: data.scientificName,
    description: data.aboutText,
    about: {
      "@type": "Thing",
      name: data.scientificName,
      alternateName: data.commonName,
    },
    publisher: {
      "@type": "Organization",
      name: "Ariod Atlas",
      url: "https://ariodatlas.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlantDetailPage data={data} genus={genus.toLowerCase()} />
    </>
  );
}
