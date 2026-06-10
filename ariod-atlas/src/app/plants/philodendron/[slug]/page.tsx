import Image from "next/image";
import Link from "next/link";
import plantData from "@/content/plants/philodendron/spiritus-sancti.json";
import PriceChart from "./price-chart";

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
    currentMedianPriceGBP: number;
    threeMonthChangePercent: number;
    marketStatus: string;
  };
  priceHistory: PricePoint[];
  recommendedPlants: RecommendedPlant[];
}

const data = plantData as PlantData;

interface PageProps {
  params: { slug: string };
}

export default function PlantPage({ params }: PageProps) {
  const {
    name,
    commonName,
    statusTag,
    origin,
    rarityStatus,
    priceGuideTier,
    aboutText,
    quickFacts,
    morphology,
    priceHistory,
    recommendedPlants,
  } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 max-w-7xl mx-auto px-4 py-8 bg-background">
      {/* ===== LEFT COLUMN (Cols 1-7) ===== */}
      <div className="lg:col-span-7 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-primary transition-colors">
            Explore
          </Link>
          <span>/</span>
          <span className="text-heading">Philodendron</span>
          <span>/</span>
          <span className="text-heading">{params.slug}</span>
        </nav>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading">
          {commonName}
        </h1>

        {/* Action Dashboard Row */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add to Collection
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-card/80 px-4 py-2 text-sm font-medium text-muted transition hover:bg-card/50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            Wishlist
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-card/80 px-4 py-2 text-sm font-medium text-muted transition hover:bg-card/50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Share
          </button>
        </div>

        {/* Core Status Row */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf/10 px-3 py-1 text-xs font-medium text-leaf">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {rarityStatus}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-price/10 px-3 py-1 text-xs font-medium text-price">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {priceGuideTier}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted">
            <svg className="h-3.5 w-3.5 text-leaf" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {origin}
          </span>
          {statusTag && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rarity/10 px-3 py-1 text-xs font-medium text-rarity">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {statusTag}
            </span>
          )}
        </div>

        {/* Main Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-card">
          <Image
            src={`/images/plants/${params.slug}.jpg`}
            alt={commonName}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Maturity Progression Slider Row */}
        <div className="rounded-xl bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-heading">
            Maturity Progression
          </h3>
          <div className="flex items-center gap-4">
            <span className="shrink-0 text-xs text-muted">Juvenile</span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-background">
              <div
                className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary/60 to-primary"
                style={{ width: "65%" }}
              />
            </div>
            <span className="shrink-0 text-xs text-muted">Mature</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Typical mature leaf size: 60–120 cm in length
          </p>
        </div>

        {/* Morphology List */}
        <div>
          <h2 className="mb-4 text-lg font-heading font-bold text-heading">
            Morphology
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {Object.entries(morphology).map(([key, value]) => (
              <div key={key} className="flex items-baseline justify-between border-b border-card/50 pb-2">
                <span className="text-xs font-medium capitalize text-muted">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="text-sm text-heading">{value as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About Plant */}
        <div>
          <h2 className="mb-3 text-lg font-heading font-bold text-heading">
            About
          </h2>
          <p className="text-sm leading-relaxed text-muted">{aboutText}</p>
        </div>
      </div>

      {/* ===== RIGHT SIDEBAR (Cols 8-10) ===== */}
      <div className="lg:col-span-3 space-y-6">
        <div className="sticky top-24 space-y-6">
          {/* Quick Facts */}
          <div className="rounded-xl bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-heading">
              Quick Facts
            </h3>
            <div className="space-y-3">
              {Object.entries(quickFacts).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-muted capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-xs font-medium text-heading text-right max-w-[140px]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Chart */}
          <div className="rounded-xl bg-card p-5">
            <h3 className="mb-1 text-sm font-semibold text-heading">
              Price History
            </h3>
            <p className="mb-4 text-xs text-muted">
              Median GBP — Last 6 months
            </p>
            <PriceChart
              data={priceHistory}
              currentPrice={data.marketMetrics.currentMedianPriceGBP}
            />
          </div>

          {/* Etsy Button */}
          <a
            href={`https://www.etsy.com/uk/search?q=${encodeURIComponent(name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-background transition hover:bg-primary/90"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
            </svg>
            Find Live Specimens on Etsy UK
          </a>
        </div>
      </div>

      {/* ===== BOTTOM FOOTPRINT: Recommended Plants ===== */}
      <div className="lg:col-span-10 mt-4">
        <h2 className="mb-5 text-lg font-heading font-bold text-heading">
          Recommended For You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {recommendedPlants.map((plant) => (
            <Link
              key={plant.slug}
              href={`/plants/philodendron/${plant.slug}`}
              className="group rounded-xl bg-card p-4 transition hover:bg-card/80"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-heading group-hover:text-primary transition-colors">
                    {plant.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-leaf/10 px-2 py-0.5 text-[10px] font-medium text-leaf">
                      {plant.rarity}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-price/10 px-2 py-0.5 text-[10px] font-medium text-price">
                      {plant.price}
                    </span>
                  </div>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-background">
                  <svg
                    className="h-6 w-6 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}