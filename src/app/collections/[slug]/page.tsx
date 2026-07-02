import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import fs from "fs";
import path from "path";
import { collections } from "@/lib/mock-data";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";

interface PlantData {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  rarityStatus: string;
  priceGuideTier: string;
  genus: string;
  genusSlug: string;
  collectorPopularity: number;
  morphology: {
    variegation: string;
  };
  quickFacts: {
    growthHabit: string;
    matureSize: string;
  };
}

interface PageProps {
  params: { slug: string };
}

function getCollectionBySlug(slug: string) {
  return collections.find((c) => c.slug === slug);
}

function getAllPlants(): PlantData[] {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  const list: PlantData[] = [];
  if (!fs.existsSync(plantsRoot)) return [];

  const genera = fs.readdirSync(plantsRoot).filter((f) => {
    return fs.statSync(path.join(plantsRoot, f)).isDirectory();
  });

  for (const genus of genera) {
    const genusDir = path.join(plantsRoot, genus);
    const files = fs.readdirSync(genusDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(genusDir, file), "utf-8");
        const data = JSON.parse(raw);
        list.push({
          slug: data.slug,
          name: data.name,
          scientificName: data.scientificName,
          commonName: data.commonName,
          rarityStatus: data.rarityStatus,
          priceGuideTier: data.priceGuideTier,
          genus: data.genus || genus,
          genusSlug: genus,
          collectorPopularity: data.collectorPopularity || 0,
          morphology: data.morphology || { variegation: "None" },
          quickFacts: data.quickFacts || { growthHabit: "", matureSize: "" },
        });
      } catch (err) {
        console.error("Error reading plant data for collection:", err);
      }
    }
  }

  return list;
}

function filterPlantsForCollection(slug: string, plants: PlantData[]): PlantData[] {
  switch (slug) {
    case "rare-climbers":
      return plants.filter(
        (p) =>
          p.quickFacts.growthHabit.toLowerCase().includes("climbing") ||
          ["spiritus-sancti", "devil-monster", "billietiae-variegated"].includes(p.slug)
      );
    case "variegated-beauties":
      return plants.filter(
        (p) =>
          p.scientificName.toLowerCase().includes("variegated") ||
          (p.morphology.variegation && p.morphology.variegation.toLowerCase() !== "none")
      );
    case "collector-favorites":
      return plants.filter((p) => p.collectorPopularity >= 4.0);
    case "most-expensive":
      return plants.filter((p) => p.priceGuideTier === "££££");
    case "giant-aroids":
      return plants.filter(
        (p) =>
          p.quickFacts.matureSize.toLowerCase().includes("cm") ||
          ["spiritus-sancti", "devil-monster", "billietiae-variegated"].includes(p.slug)
      );
    case "new-discoveries":
    default:
      return plants; // Fallback to all
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const collection = getCollectionBySlug(params.slug);
  if (!collection) return { title: "Collection Not Found" };
  const title = `${collection.name} — Curated Rare Plant Collection`;
  const canonicalUrl = `https://aroidatlas.co.uk/collections/${params.slug}`;
  return {
    title,
    description: collection.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | Aroid Atlas`,
      description: collection.description,
      url: canonicalUrl,
      siteName: "Aroid Atlas",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Aroid Atlas`,
      description: collection.description,
    },
  };
}

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export default function CollectionPage({ params }: PageProps) {
  const collection = getCollectionBySlug(params.slug);

  if (!collection) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-heading font-bold text-heading">Collection Not Found</p>
          <Link href="/plants" className="btn-primary mt-6 inline-flex">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const allPlants = getAllPlants();
  const plants = filterPlantsForCollection(collection.slug, allPlants);

  const baseUrl = "https://aroidatlas.co.uk";
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
          { "@type": "ListItem", position: 2, name: collection.name, item: `${baseUrl}/collections/${collection.slug}` },
        ],
      },
      {
        "@type": "ItemList",
        name: collection.name,
        description: collection.description,
        numberOfItems: plants.length,
        itemListElement: plants.slice(0, 20).map((plant, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: plant.scientificName,
          url: `${baseUrl}/plants/${plant.genusSlug}/${plant.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <nav className="flex items-center gap-2 text-xs text-muted mb-8">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-heading">{collection.name}</span>
      </nav>

      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
          {collection.name}
        </h1>
        <p className="text-sm md:text-base text-muted max-w-2xl">
          {collection.description}
        </p>
      </div>

      {plants.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted">No plants found in this collection yet.</p>
          <Link href="/plants" className="btn-primary mt-6 inline-flex">
            Browse All Species
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <Link
              key={plant.slug}
              href={`/plants/${plant.genusSlug}/${plant.slug}`}
              className="glass-card-hover group relative flex overflow-hidden rounded-2xl p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-forest-deep via-card to-forest-dark opacity-50" />
              <div className="relative flex justify-between items-center w-full gap-4 z-10">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-heading font-bold text-heading italic group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {plant.scientificName}
                  </h3>
                  <p className="mt-1 text-xs text-muted truncate">{plant.commonName}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="badge-price">
                      {plant.priceGuideTier} · {getStaticTierLabel(plant.priceGuideTier)}
                    </span>
                    <span className="badge-primary text-[10px]">{plant.rarityStatus}</span>
                  </div>
                </div>
                
                {/* Right-aligned soft-reveal thumbnail */}
                <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-card border border-primary/5">
                  <Image
                    src={`/plants/${plant.genusSlug}/${plant.slug}.png`}
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
