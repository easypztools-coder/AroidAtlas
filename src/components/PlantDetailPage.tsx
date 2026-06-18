"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import type { PriceHistoryPoint } from "@/lib/prices/types";
import { getPriceRarityTier, getStaticTierLabel } from "@/lib/prices/priceRarityTier";

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
  genus?: string;
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
    currentMedianPriceGBP: number | null;
    threeMonthChangePercent: number | null;
    marketStatus: string | null;
  };
  priceHistory?: PricePoint[];
  recommendedPlants: RecommendedPlant[];
  fieldNotes?: {
    title: string;
    date: string;
    author: string;
    content: string;
  };
}

function PopularityStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg
          key={`full-${i}`}
          className="h-4 w-4 text-leaf"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {hasHalf && (
        <svg
          className="h-4 w-4 text-leaf"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="url(#halfStar)"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg
          key={`empty-${i}`}
          className="h-4 w-4 text-muted/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

const GENUS_LABELS: Record<string, string> = {
  monstera: "Monstera",
  philodendron: "Philodendron",
  anthurium: "Anthurium",
  alocasia: "Alocasia",
};


export default function PlantDetailPage({
  data,
  genus,
}: {
  data: PlantData;
  genus: string;
}) {
  const morphEntries = Object.entries(data.morphology);
  const genusLabel = GENUS_LABELS[genus] ?? genus;

  // ─── Fetch live price history ───────────────────────────────────────────
  const [soldCompsData, setSoldCompsData] = useState<PriceHistoryPoint[]>([]);
  const [fairPrice, setFairPrice] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/plants/${data.slug}/price-history`)
      .then((res) => res.json())
      .then((json) => {
        if (json.history && Array.isArray(json.history)) {
          setSoldCompsData(json.history);
        }
        if (typeof json.fairPurchasePrice === "number") {
          setFairPrice(json.fairPurchasePrice);
        }
      })
      .catch(() => {
        // Silently fail — chart will show empty state
      });
  }, [data.slug]);

  const combinedTier = fairPrice !== null
    ? getPriceRarityTier(fairPrice)
    : { tier: data.priceGuideTier, label: getStaticTierLabel(data.priceGuideTier) };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 max-w-7xl mx-auto px-4 py-8 bg-background lg:items-start">
      {/* ===== LEFT COLUMN (Cols 1-7) ===== */}
      <div className="lg:col-span-7 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-muted">
          <Link href="/plants" className="hover:text-primary transition-colors">
            Species
          </Link>
          <span>/</span>
          <Link href={`/plants/${genus}`} className="hover:text-primary transition-colors">
            {genusLabel}
          </Link>
          <span>/</span>
          <span className="text-heading">{data.scientificName}</span>
        </nav>

        {/* Heading + Status Tags Row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading italic">
              {data.scientificName}
            </h1>
            <p className="text-sm text-muted mt-1">{data.commonName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.statusTag && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rarity/10 px-3 py-1 text-xs font-medium text-rarity">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {data.statusTag}
              </span>
            )}
          </div>
        </div>

        {/* Action Panel Row */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-card/80 px-4 py-2 text-sm font-medium text-muted transition hover:bg-card/50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            Save
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add to Collection
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-card/80 px-4 py-2 text-sm font-medium text-muted transition hover:bg-card/50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Share
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-card/80 px-4 py-2 text-sm font-medium text-muted transition hover:bg-card/50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </button>
        </div>

        {/* Status Row */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted">
            <PopularityStars rating={data.collectorPopularity} />
            <span className="ml-1">Popularity</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-price/10 px-3 py-1 text-xs font-medium text-price">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {combinedTier.tier} · {combinedTier.label}
          </span>
          {data.availability && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted">
              <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.75m12-3.872a2.25 2.25 0 013 2.25v.75M6 6.878A2.25 2.25 0 004.5 9v.75m0 0h15" />
              </svg>
              {data.availability}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted">
            <svg className="h-3.5 w-3.5 text-leaf" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {data.origin}
          </span>
        </div>

        {/* Main Feature Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-card">
          <Image
            src={`/api/plant-image?genus=${genus}&slug=${data.slug}`}
            alt={data.commonName}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Split Baseline: Morphology + About + Climate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="mb-4 text-lg font-heading font-bold text-heading">
              Morphology
            </h2>
            <div className="space-y-3">
              {morphEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between border-b border-card/50 pb-2"
                >
                  <span className="text-xs font-medium capitalize text-muted">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-sm text-heading text-right max-w-[180px]">
                    {value as string}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-heading font-bold text-heading">
              About
            </h2>
            <p className="text-sm leading-relaxed text-muted mb-5">
              {data.aboutText}
            </p>

            <div className="rounded-lg bg-card/60 p-4 border border-card/80">
              <h4 className="text-xs font-semibold text-heading mb-3 uppercase tracking-wider">
                Climate Profile
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-muted">Origin</span>
                  <span className="text-heading font-medium">{data.origin}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted">Humidity</span>
                  <span className="text-heading font-medium">{data.quickFacts.humidity}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted">Temperature</span>
                  <span className="text-heading font-medium">{data.quickFacts.temperature}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted">Light</span>
                  <span className="text-heading font-medium">{data.quickFacts.light}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted">Family</span>
                  <span className="text-heading font-medium">{data.family}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted">Genus</span>
                  <span className="text-heading font-medium">{data.genus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Field Notes by Aaron (Vintage Journal Style) */}
        {data.fieldNotes && (
          <div className="relative overflow-hidden rounded-2xl bg-[#F4F0EA] border-2 border-[#E3DEC3] p-8 text-[#1A2421] shadow-lg">
            {/* Double-ruled notebook frame */}
            <div className="absolute inset-4 border border-dashed border-[#A8B5AE]/30 pointer-events-none" />
            <div className="absolute inset-5 border border-double border-[#8B9A92]/40 pointer-events-none rounded-lg" />
            
            <div className="relative z-10 px-4 py-2">
              <div className="flex items-center justify-between border-b border-[#8B9A92]/20 pb-3 mb-4">
                <span className="text-[10px] font-bold tracking-widest text-[#8B9A92] uppercase font-body">
                  Field Notes &middot; Vol. 1
                </span>
                <span className="text-xs font-semibold text-[#8B9A92] font-body">
                  {new Date(data.fieldNotes.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>

              <h3 className="text-xl font-heading font-bold text-[#1A2421] mb-3 leading-tight italic">
                {data.fieldNotes.title}
              </h3>

              <p className="text-sm leading-relaxed text-[#2C3531] font-heading font-serif">
                {data.fieldNotes.content}
              </p>

              <div className="mt-6 flex items-center justify-between text-xs text-[#8B9A92] font-body">
                <span className="italic">Written at AroidAtlas research station</span>
                <span className="font-semibold italic text-[#1A2421] font-heading text-sm">
                  &mdash; Aaron
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== RIGHT SIDEBAR (Cols 8-10) ===== */}
      <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="rounded-xl bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-heading">
              Quick Facts
            </h3>
            <div className="space-y-3">
              {Object.entries(data.quickFacts).map(([key, value]) => (
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
            <Link href="/learn" className="mt-5 block w-full rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold text-background transition hover:bg-primary/90">
              View Care Guide
            </Link>
          </div>

          <div className="rounded-xl bg-card p-5">
            <h3 className="mb-1 text-sm font-semibold text-heading">
              Price History
            </h3>
            <p className="mb-4 text-xs text-muted">
              eBay UK sold prices — Updated weekly
            </p>
            <PriceHistoryChart
              data={soldCompsData}
            />

            {/* ── Fair Purchase Price ──────────────────────────────────── */}
            {fairPrice !== null && (
              <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Fair Purchase Price</span>
                  <span className="text-lg font-bold text-green-400">
                    £{fairPrice.toFixed(0)}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-muted/60">
                  Based on recent eBay UK sold prices, excluding top and bottom 20% outliers.
                  Updated twice weekly.
                </p>
              </div>
            )}

            {soldCompsData.length > 0 && data.marketMetrics.marketStatus && (
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    data.marketMetrics.marketStatus === "Volatile"
                      ? "bg-rarity/10 text-rarity"
                      : data.marketMetrics.marketStatus === "Rising"
                      ? "bg-green-500/10 text-green-400"
                      : data.marketMetrics.marketStatus === "Declining"
                      ? "bg-orange-500/10 text-orange-400"
                      : "bg-muted/10 text-muted"
                  }`}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    {data.marketMetrics.marketStatus === "Rising" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    ) : data.marketMetrics.marketStatus === "Declining" || data.marketMetrics.marketStatus === "Volatile" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.95 11.95 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    )}
                  </svg>
                  {data.marketMetrics.marketStatus}
                </span>
                <span className="text-xs text-muted">
                  {(data.marketMetrics.threeMonthChangePercent ?? 0) > 0 ? "+" : ""}
                  {(data.marketMetrics.threeMonthChangePercent ?? 0).toFixed(1)}% 3mo
                </span>
              </div>
            )}
          </div>

          <a
            href={`https://www.etsy.com/uk/search?q=${encodeURIComponent(data.name)}`}
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

      {/* ===== BOTTOM FOOTPRINT: Recommended Plants ===== */}
      <div className="lg:col-span-10 mt-4">
        <h2 className="mb-5 text-lg font-heading font-bold text-heading">
          Recommended For You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {data.recommendedPlants.map((plant) => {
            const recommendedGenus = (plant.genus || plant.name.split(" ")[0].replace(/['"]/g, "")).toLowerCase();
            return (
              <Link
                key={plant.slug}
                href={`/plants/${recommendedGenus}/${plant.slug}`}
                className="group rounded-xl bg-card p-4 transition hover:bg-card/80"
              >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-heading group-hover:text-primary transition-colors">
                    {plant.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-price/10 px-2 py-0.5 text-[10px] font-medium text-price">
                      {plant.price} · {getStaticTierLabel(plant.price)}
                    </span>
                  </div>
                </div>
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-background border border-primary/5 shrink-0">
                  <Image
                    src={`/api/plant-image?genus=${recommendedGenus}&slug=${plant.slug}`}
                    alt={plant.name}
                    fill
                    className="object-cover object-center scale-[1.3] transition-all duration-500 ease-out group-hover:scale-[1.4] opacity-90 group-hover:opacity-100"
                    sizes="64px"
                  />
                  {/* Spotlight overlay for recommended thumbnail */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(10,15,12,0.8)_80%,#0A0F0C_100%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </Link>
          );
          })}
        </div>
      </div>
    </div>
  );
}