"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import type { PriceHistoryPoint } from "@/lib/prices/types";
import { getPriceRarityTier, getStaticTierLabel } from "@/lib/prices/priceRarityTier";
import { getBotanicalTypeDetails } from "@/components/GenusPlantList";

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
  begonia: "Begonia",
  other: "Other Aroids",
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
  interface RecentSale {
    title: string;
    soldPrice: number;
    totalPrice: number;
    soldDate: string | null;
    currency: string;
    url: string;
  }

  const [soldCompsData, setSoldCompsData] = useState<PriceHistoryPoint[]>([]);
  const [fairPrice, setFairPrice] = useState<number | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);

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
        if (json.recentSales && Array.isArray(json.recentSales)) {
          setRecentSales(json.recentSales);
        }
      })
      .catch(() => {
        // Silently fail — chart will show empty state
      });
  }, [data.slug]);

  // ─── Fetch live retail price data ──────────────────────────────────────────
  const [retailData, setRetailData] = useState<{
    listings: any[];
    statsByType: Record<string, any>;
    history: any[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/plants/${data.slug}/retail-market`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setRetailData({
            listings: json.listings || [],
            statsByType: json.statsByType || {},
            history: json.history || [],
          });
        }
      })
      .catch(() => {
        // Silently fail
      });
  }, [data.slug]);

  const combinedTier = fairPrice !== null
    ? getPriceRarityTier(fairPrice)
    : { tier: data.priceGuideTier, label: getStaticTierLabel(data.priceGuideTier) };

  return (
    <div className="plant-detail-container">
      <div className="plant-detail-grid">
        {/* ===== LEFT COLUMN (Cols 1-7) ===== */}
        <div className="plant-detail-main-col">
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
            {data.botanicalType && (() => {
              const details = getBotanicalTypeDetails(data.botanicalType);
              return (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${details.badgeClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${details.dotClass}`} />
                  {details.label}
                </span>
              );
            })()}
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

            <div className="rounded-lg bg-card/80 p-4 border border-primary/15">
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

        {/* ─── Market Analysis & Price Guide ─────────────────────────────────── */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-heading">
              Market Analysis & Price Guide
            </h2>
            <p className="text-xs text-muted mt-1">
              Historical auction metrics and live online retailer listings updated weekly.
            </p>
          </div>

          {/* Unified Price Dashboard KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Est. Auction Value */}
            <div className="rounded-xl border border-primary/10 bg-card-hover/40 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Est. Auction Value</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-primary">
                  {fairPrice !== null ? `£${fairPrice.toFixed(0)}` : "N/A"}
                </span>
                {fairPrice !== null && <span className="text-[10px] text-muted">GBP</span>}
              </div>
              <span className="mt-2 text-[10px] text-muted/65 leading-tight">
                eBay UK fair value guide (excluding outliers)
              </span>
            </div>

            {/* Card 2: Average Retail Value */}
            <div className="rounded-xl border border-primary/10 bg-card-hover/40 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Average Retail Value</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-primary">
                  {retailData?.statsByType?.all ? `£${retailData.statsByType.all.trimmedMean.toFixed(0)}` : "N/A"}
                </span>
                {retailData?.statsByType?.all && <span className="text-[10px] text-muted">GBP</span>}
              </div>
              <span className="mt-2 text-[10px] text-muted/65 leading-tight">
                {retailData?.statsByType?.all?.count ? `${retailData.statsByType.all.count} UK shops tracked` : "Online store average"}
              </span>
            </div>

            {/* Card 3: Price Gap Recommendation */}
            <div className="rounded-xl border border-primary/10 bg-card-hover/40 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Smart Buy Rating</span>
              <div className="mt-2">
                {fairPrice !== null && retailData?.statsByType?.all ? (
                  (() => {
                    const diff = retailData.statsByType.all.trimmedMean - fairPrice;
                    const pct = (diff / retailData.statsByType.all.trimmedMean) * 100;
                    if (diff > 5) {
                      return (
                        <>
                          <span className="text-lg font-bold text-green-400">Save {pct.toFixed(0)}%</span>
                          <span className="block text-[10px] text-muted/80 mt-1 leading-tight">
                            Auctions are cheaper than retail stores
                          </span>
                        </>
                      );
                    } else if (diff < -5) {
                      return (
                        <>
                          <span className="text-lg font-bold text-primary">Buy Retail</span>
                          <span className="block text-[10px] text-muted/80 mt-1 leading-tight">
                            Retail stores offer competitive prices
                          </span>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <span className="text-lg font-bold text-muted-light">Comparable</span>
                          <span className="block text-[10px] text-muted/80 mt-1 leading-tight">
                            Prices are similar across markets
                          </span>
                        </>
                      );
                    }
                  })()
                ) : (
                  <span className="text-lg font-bold text-muted">Awaiting Data</span>
                )}
              </div>
              <span className="mt-2 text-[10px] text-muted/65 leading-tight">
                Where to find the best market value
              </span>
            </div>

            {/* Card 4: Market Status & Volatility */}
            <div className="rounded-xl border border-primary/10 bg-card-hover/40 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Market Trend</span>
              <div className="mt-2 flex items-center gap-1.5">
                {data.marketMetrics.marketStatus ? (
                  <>
                    <span className={`text-base font-bold ${
                      data.marketMetrics.marketStatus === "Rising"
                        ? "text-green-400"
                        : data.marketMetrics.marketStatus === "Declining"
                        ? "text-orange-400"
                        : "text-rarity"
                    }`}>
                      {data.marketMetrics.marketStatus}
                    </span>
                    {data.marketMetrics.threeMonthChangePercent !== null && (
                      <span className="text-[10px] text-muted">
                        ({data.marketMetrics.threeMonthChangePercent > 0 ? "+" : ""}{data.marketMetrics.threeMonthChangePercent.toFixed(0)}%)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-base font-bold text-muted">Stable</span>
                )}
              </div>
              <span className="mt-2 text-[10px] text-muted/65 leading-tight">
                Price velocity over the last 90 days
              </span>
            </div>
          </div>

          {/* Large Focused Price History Graph + Recent Sales */}
          <div className="border-t border-primary/10 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Graph (2/3 width on desktop) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-heading">eBay Auction Price Trend</h3>
                    <p className="text-[10px] text-muted">Weekly aggregated completed auction sales in the UK</p>
                  </div>
                  {soldCompsData.length > 0 && (
                    <span className="text-[10px] text-muted-light bg-card/60 border border-primary/10 px-2 py-0.5 rounded-full">
                      {soldCompsData.reduce((sum, d) => sum + d.sampleSize, 0)} sales analyzed
                    </span>
                  )}
                </div>
                
                {/* The actual chart - wide view container */}
                <PriceHistoryChart data={soldCompsData} />
              </div>

              {/* Right Column: Recent Sales History (1/3 width on desktop) */}
              <div className="lg:col-span-1 space-y-4 flex flex-col">
                <div>
                  <h3 className="text-sm font-semibold text-heading">Recent eBay Sales</h3>
                  <p className="text-[10px] text-muted">Direct verified completed transaction history</p>
                </div>

                <div className="flex-1 rounded-xl border border-primary/5 bg-card/20 p-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {recentSales && recentSales.length > 0 ? (
                    recentSales.map((sale, idx) => {
                      const displayTitle = sale.title || `${data.scientificName} - eBay Sale`;
                      const displayDate = sale.soldDate
                        ? new Date(sale.soldDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Date N/A";
                      
                      const element = (
                        <div className="flex flex-col gap-1 rounded-lg border border-primary/5 bg-card/40 p-2.5 hover:bg-card-hover/60 transition-colors">
                          <div className="text-[10px] font-medium text-heading line-clamp-1">
                            {displayTitle}
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-muted">
                            <span>{displayDate}</span>
                            <span className="font-bold text-green-400">£{sale.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      );

                      if (sale.url) {
                        return (
                          <a
                            key={idx}
                            href={sale.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            {element}
                          </a>
                        );
                      }
                      return (
                        <div key={idx}>
                          {element}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted italic text-center py-8">No recent eBay transactions found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Retail Listings & Breakdown Sub-Grid */}
          {retailData && (retailData.listings.length > 0 || Object.keys(retailData.statsByType).length > 0) && (
            <div className="border-t border-primary/10 pt-6 grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left Column: Live Retail Listings (Referral Links) */}
              <div className="md:col-span-3 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-heading">Available Retail Specimens</h3>
                  <p className="text-[10px] text-muted mb-2">Click to visit store and purchase directly (prices include VAT)</p>
                </div>
                
                {retailData.listings.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {retailData.listings.map((list: any, idx: number) => (
                      <a
                        key={idx}
                        href={list.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/5 bg-card/50 p-3.5 hover:bg-card-hover/80 hover:border-primary/20 transition-all duration-300 shadow-sm"
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-heading group-hover:text-primary transition-colors line-clamp-1">
                            {list.title}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-muted">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">{list.retailerName}</span>
                            {list.potSizeCm && <span>{list.potSizeCm}cm Pot</span>}
                            {list.plantSizeLabel && <span className="capitalize">{list.plantSizeLabel.replace(/_/g, " ")}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-400">
                              £{list.priceGbp.toFixed(2)}
                            </div>
                            {list.originalPriceGbp && (
                              <div className="text-[9px] text-muted line-through">
                                £{list.originalPriceGbp.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-background bg-primary group-hover:bg-primary-dark rounded-lg px-3 py-1.5 transition-colors duration-200">
                            Buy Now
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">No retail specimens currently in stock.</p>
                )}
              </div>

              {/* Right Column: Size/Form price stats */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-heading">Average Price by Form</h3>
                  <p className="text-[10px] text-muted">Based on active retail listings</p>
                </div>
                
                <div className="rounded-xl border border-primary/5 bg-card/30 p-4 space-y-3.5">
                  {Object.entries(retailData.statsByType).map(([type, stats]: [string, any]) => {
                    if (type === "all") return null;
                    const formattedType = type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div key={type} className="flex flex-col gap-1 pb-2.5 border-b border-primary/5 last:border-0 last:pb-0">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-light font-medium">{formattedType}</span>
                          <span className="font-semibold text-heading">£{stats.trimmedMean.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-muted">
                          <span>Range: £{stats.min.toFixed(0)} - £{stats.max.toFixed(0)}</span>
                          <span>{stats.count} items</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {Object.keys(retailData.statsByType).filter(k => k !== "all").length === 0 && (
                    <p className="text-xs text-muted italic">No form statistics available.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Field Notes by Aroid Aaron (Vintage Journal Style) */}
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
                  &mdash; Aroid Aaron
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== RIGHT SIDEBAR (Cols 8-10) ===== */}
      <div className="plant-detail-sidebar-col">
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

      {/* Close the plant-detail-grid container */}
      </div>

      {/* ===== BOTTOM FOOTPRINT: Recommended Plants ===== */}
      <div className="plant-detail-recommended-section">
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