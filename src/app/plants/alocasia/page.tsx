import Link from "next/link";
import fs from "fs";
import path from "path";

interface PlantSummary {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  rarityStatus: string;
  priceGuideTier: string;
}

function getAllAlocasiaPlants(): PlantSummary[] {
  const dirPath = path.join(process.cwd(), "content", "plants", "alocasia");
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

export default function AlocasiaPage() {
  const plants = getAllAlocasiaPlants();

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <nav className="flex items-center gap-2 text-xs text-muted mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Explore</Link>
        <span>/</span>
        <Link href="/plants" className="hover:text-primary transition-colors">Plants</Link>
        <span>/</span>
        <span className="text-heading">Alocasia</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
        Alocasia
      </h1>
      <p className="text-sm md:text-base text-muted max-w-2xl mb-12">
        Striking foliage plants known for their bold, shield-shaped leaves and dramatic veining. Browse our collection of Alocasia species and cultivars.
      </p>

      {plants.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted">No Alocasia species data available yet. Check back soon!</p>
          <Link href="/plants" className="btn-primary mt-6 inline-flex">Browse All Genera</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <Link
              key={plant.slug}
              href={`/plants/alocasia/${plant.slug}`}
              className="glass-card-hover group relative flex flex-col overflow-hidden rounded-2xl p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-forest-deep via-card to-forest-dark opacity-50" />
              <div className="relative">
                <h3 className="text-lg font-heading font-bold text-heading group-hover:text-primary transition-colors duration-300">
                  {plant.name}
                </h3>
                <p className="mt-1 text-xs text-muted">{plant.commonName}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="badge-rarity">{plant.rarityStatus}</span>
                  <span className="badge-price">{plant.priceGuideTier}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}