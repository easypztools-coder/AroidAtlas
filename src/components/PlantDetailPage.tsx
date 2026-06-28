"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const PriceHistoryChart = dynamic(() => import("@/components/PriceHistoryChart"), {
  loading: () => <div className="h-48 animate-pulse rounded bg-background-soft" />,
  ssr: false,
});
const PlantPhotoCarousel = dynamic(() => import("@/components/PlantPhotoCarousel"), {
  loading: () => <div className="aspect-[4/3] animate-pulse rounded border border-border bg-background-soft" />,
  ssr: false,
});

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

interface Propagation {
  methods: string[];
  difficulty: "Easy" | "Moderate" | "Challenging" | "Expert Only";
  timeToEstablished: string;
  propagatesTrue: boolean | null;
  notes?: string;
}

interface CareGuide {
  substrate: string;
  watering: string;
  humidity: string;
  fertilising: string;
  repotting: string;
  commonProblems: { problem: string; cause: string; fix: string }[];
}

interface BuyerChecklist {
  items: string[];
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
  propagation?: Propagation;
  careGuide?: CareGuide;
  buyerChecklist?: BuyerChecklist;
  fieldNotes?: {
    title: string;
    date: string;
    author: string;
    content: string;
  };
}

function ShareButton({ scientificName }: { scientificName: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out ${scientificName} on Aroid Atlas — rare plant profiles & live UK prices`;
    if (navigator.share) {
      try {
        await navigator.share({ title: scientificName, text, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium text-muted transition-all duration-150 hover:border-border-strong hover:text-heading"
    >
      {copied ? (
        <>
          <svg className="h-4 w-4 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Link Copied
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}

function formatHumidity(value: string): string {
  if (/humidity/i.test(value)) return value;
  // "High" → "High humidity", "High (70-80%)" → "High humidity (70-80%)"
  // "Consistently high" → "Consistently high humidity", etc.
  return value.replace(
    /^((?:consistently\s+)?(?:very\s+)?(?:high|medium|low|moderate))(\s*\(|$)/i,
    (_, level, rest) => `${level} humidity${rest}`
  );
}

const PROPAGATION_GUIDE_SLUGS: Record<string, string> = {
  "Stem cutting": "stem-cutting",
  "Node cutting": "node-cutting",
  "Leaf cutting": "leaf-cutting",
  "Rhizome division": "rhizome-division",
  "Corm division": "offsets-and-pups",
  "Offset (corm/pup)": "offsets-and-pups",
  "Offset (keiki)": "offsets-and-pups",
  "Air layering": "air-layering",
  "Seed": "seed-propagation",
};

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

  interface RecentSale {
    title: string;
    soldPrice: number;
    totalPrice: number;
    soldDate: string | null;
    currency: string;
    url: string;
    listingType?: string;
  }

  const [soldCompsData, setSoldCompsData] = useState<PriceHistoryPoint[]>([]);
  const [fairPrice, setFairPrice] = useState<number | null>(null);
  const [fairPriceIsEstimate, setFairPriceIsEstimate] = useState(false);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [hoveredWeekDate, setHoveredWeekDate] = useState<string | null>(null);
  const [priceSampleCount, setPriceSampleCount] = useState<number | null>(null);
  const [priceConfidence, setPriceConfidence] = useState<string | null>(null);

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
        setFairPriceIsEstimate(json.isEstimate === true);
        if (json.recentSales && Array.isArray(json.recentSales)) {
          setRecentSales(json.recentSales);
        }
        if (typeof json.sampleCount === "number") {
          setPriceSampleCount(json.sampleCount);
        }
        if (typeof json.confidenceScore === "string") {
          setPriceConfidence(json.confidenceScore);
        }
      })
      .catch(() => {});
  }, [data.slug]);

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
      .catch(() => {});
  }, [data.slug]);

  function getISOWeekKey(dateStr: string): string {
    const date = new Date(dateStr);
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  const retailAverage: { value: number; count: number } | null = (() => {
    if (retailData?.statsByType?.all) {
      return { value: retailData.statsByType.all.trimmedMean, count: retailData.statsByType.all.count };
    }
    if (retailData && retailData.listings.length > 0) {
      const inStock = retailData.listings.filter((l: any) => l.inStock !== false);
      const source = inStock.length > 0 ? inStock : retailData.listings;
      const prices = source.map((l: any) => l.priceGbp as number);
      const mean = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      return { value: mean, count: source.length };
    }
    return null;
  })();

  const aaDisplayPrice: { value: number; source: "ebay" | "retail" | "estimate" } | null = (() => {
    if (fairPrice !== null && !fairPriceIsEstimate) return { value: fairPrice, source: "ebay" };
    if (retailAverage !== null) return { value: Math.round(retailAverage.value), source: "retail" };
    if (fairPrice !== null) return { value: fairPrice, source: "estimate" };
    return null;
  })();

  const latestWeek = soldCompsData.length > 0 ? soldCompsData[soldCompsData.length - 1] : null;
  const showTypicalRange = latestWeek !== null && !fairPriceIsEstimate && latestWeek.p25 < latestWeek.p75;

  const liveMarketTrend: { changePct: number; status: "Rising" | "Declining" | "Stable" } | null = (() => {
    if (soldCompsData.length < 4) return null;
    const recent = soldCompsData.slice(-3);
    const older = soldCompsData.slice(0, soldCompsData.length - 3);
    const recentMed = recent.reduce((s, p) => s + p.median, 0) / recent.length;
    const olderMed = older.reduce((s, p) => s + p.median, 0) / older.length;
    if (olderMed === 0) return null;
    const changePct = ((recentMed - olderMed) / olderMed) * 100;
    return {
      changePct,
      status: changePct > 10 ? "Rising" : changePct < -10 ? "Declining" : "Stable",
    };
  })();

  const combinedTier =
    aaDisplayPrice !== null
      ? getPriceRarityTier(aaDisplayPrice.value)
      : { tier: data.priceGuideTier, label: getStaticTierLabel(data.priceGuideTier) };

  return (
    <div className="plant-detail-container">
      <div className="plant-detail-grid">
        {/* ===== LEFT COLUMN ===== */}
        <div className="plant-detail-main-col">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-muted">
            <Link href="/plants" className="transition-colors duration-150 hover:text-heading">
              Species
            </Link>
            <span className="text-border-strong">/</span>
            <Link href={`/plants/${genus}`} className="transition-colors duration-150 hover:text-heading">
              {genusLabel}
            </Link>
            <span className="text-border-strong">/</span>
            <span className="text-heading">{data.name}</span>
          </nav>

          {/* Heading + Status Tags */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-semibold italic leading-tight text-heading md:text-4xl">
                {data.name}
              </h1>
              <p className="mt-1 text-sm text-muted">{data.commonName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {data.botanicalType &&
                (() => {
                  const details = getBotanicalTypeDetails(data.botanicalType);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-xs font-medium ${details.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${details.dotClass}`} />
                      {details.label}
                    </span>
                  );
                })()}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3">
            <ShareButton scientificName={data.scientificName} />
          </div>

          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {combinedTier.tier} · {combinedTier.label}
            </span>
            {data.availability && (
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                {data.availability}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              {data.origin}
            </span>
          </div>

          {/* Main Feature Image */}
          <div className="relative overflow-hidden rounded border border-border bg-background-soft">
            <div className="relative aspect-[3/4]">
              <Image
                src={`/plants/${genus}/${data.slug}.png`}
                alt={data.commonName}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/plant-placeholder.png";
                }}
              />
            </div>
          </div>

          {/* ── Auction History & Retail Data ─────────────────────── */}
          <div id="market-analysis" className="rounded border border-border bg-surface p-6 md:p-8 space-y-6">
            <div className="-mx-6 -mt-6 mb-6 h-px bg-accent/30 md:-mx-8 md:-mt-8 md:mb-8" />

            <div>
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                Market Analysis
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-heading md:text-2xl">
                Auction History & Retail Data
              </h2>
              <p className="mt-1 text-xs text-muted">
                Historical eBay auction metrics and live retailer listings updated weekly.
              </p>
            </div>

            {/* Price History Chart + Recent Sales */}
            <div className="border-t border-border pt-6">
              {soldCompsData.length === 0 && recentSales.length === 0 ? (
                <p className="py-4 text-center text-xs italic text-muted">
                  No eBay auction history available yet. Data is collected automatically as sales appear on eBay UK.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* Chart */}
                  <div className="space-y-4 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-heading">eBay Auction Price Trend</h3>
                        <p className="text-[10px] text-muted">
                          Weekly aggregated completed auction sales in the UK
                        </p>
                      </div>
                      {soldCompsData.length > 0 && (
                        <span className="rounded-sm border border-border bg-background-soft px-2 py-0.5 text-[10px] text-muted">
                          {soldCompsData.reduce((sum, d) => sum + d.sampleSize, 0)} sales analyzed
                        </span>
                      )}
                    </div>
                    <PriceHistoryChart
                      data={soldCompsData}
                      onHover={setHoveredWeekDate}
                      highlightedDate={hoveredWeekDate}
                    />
                  </div>

                  {/* Recent Sales */}
                  <div className="flex flex-col space-y-4 lg:col-span-1">
                    <div>
                      <h3 className="text-sm font-semibold text-heading">Recent eBay Sales</h3>
                      <p className="text-[10px] text-muted">Verified completed transaction history</p>
                    </div>

                    <div className="max-h-[300px] flex-1 space-y-2 overflow-y-auto rounded border border-border bg-background-soft p-3 pr-1">
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

                          const isHighlighted =
                            hoveredWeekDate && sale.soldDate
                              ? getISOWeekKey(hoveredWeekDate) === getISOWeekKey(sale.soldDate)
                              : false;

                          const typeLabel =
                            sale.listingType && sale.listingType !== "unknown"
                              ? sale.listingType
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (c) => c.toUpperCase())
                              : null;

                          const cardClass = [
                            "flex flex-col gap-1 rounded border p-2.5 transition-all duration-150",
                            isHighlighted
                              ? "border-accent/30 bg-accent/8"
                              : "border-border bg-surface hover:bg-background-soft",
                          ].join(" ");

                          const inner = (
                            <div className={cardClass}>
                              <div className="line-clamp-2 text-[10px] font-medium leading-snug text-heading">
                                {displayTitle}
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                {typeLabel && (
                                  <span className="rounded-sm bg-primary/8 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                                    {typeLabel}
                                  </span>
                                )}
                                <span className="text-[9px] text-muted">{displayDate}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-xs font-bold text-leaf">
                                  £{sale.totalPrice.toFixed(2)}
                                </span>
                                {sale.url && (
                                  <span className="text-[9px] text-muted/60">View on eBay →</span>
                                )}
                              </div>
                            </div>
                          );

                          const hoverHandlers = {
                            onMouseEnter: () => sale.soldDate && setHoveredWeekDate(sale.soldDate),
                            onMouseLeave: () => setHoveredWeekDate(null),
                          };

                          if (sale.url) {
                            return (
                              <a
                                key={idx}
                                href={sale.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                                {...hoverHandlers}
                              >
                                {inner}
                              </a>
                            );
                          }
                          return (
                            <div key={idx} {...hoverHandlers}>
                              {inner}
                            </div>
                          );
                        })
                      ) : (
                        <p className="py-8 text-center text-xs italic text-muted">
                          {soldCompsData.length > 0
                            ? "Individual sales unavailable — chart shows aggregate data."
                            : "No recent eBay transactions found."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Retail Listings */}
            {retailData && retailData.listings.length > 0 && (
              <div id="retail-specimens" className="grid grid-cols-1 gap-6 border-t border-border pt-6 md:grid-cols-5">
                <div className="space-y-3 md:col-span-3">
                  <div>
                    <h3 className="text-sm font-semibold text-heading">Retail Specimens</h3>
                    <p className="text-[10px] text-muted">
                      UK retailers — prices include VAT. Sold out items show last known price for reference.
                    </p>
                  </div>

                  <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                    {retailData.listings.map((list: any, idx: number) => (
                      <a
                        key={idx}
                        href={list.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex flex-col gap-3 rounded border p-3.5 transition-all duration-150 sm:flex-row sm:items-center sm:justify-between ${
                          list.inStock === false
                            ? "border-border bg-background-soft/50 opacity-70"
                            : "border-border bg-background-soft hover:border-border-strong hover:bg-surface"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className={`line-clamp-1 text-xs font-semibold transition-colors duration-150 ${list.inStock === false ? "text-muted" : "text-heading group-hover:text-primary"}`}>
                            {list.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[9px] text-muted">
                            <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                              {list.retailerName}
                            </span>
                            {list.inStock === false && (
                              <span className="rounded-sm bg-red-100 px-1.5 py-0.5 font-semibold text-red-600">
                                Sold Out
                              </span>
                            )}
                            {list.potSizeCm && <span>{list.potSizeCm}cm Pot</span>}
                            {list.plantSizeLabel && (
                              <span className="capitalize">{list.plantSizeLabel.replace(/_/g, " ")}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className={`text-sm font-bold ${list.inStock === false ? "text-muted" : "text-leaf"}`}>
                              £{list.priceGbp.toFixed(2)}
                            </div>
                            {list.originalPriceGbp && (
                              <div className="text-[9px] text-muted line-through">
                                £{list.originalPriceGbp.toFixed(2)}
                              </div>
                            )}
                          </div>
                          {list.inStock !== false && (
                            <span className="inline-flex items-center gap-1 rounded-sm bg-primary px-3 py-1.5 text-[10px] font-semibold text-surface transition-colors duration-150 group-hover:bg-primary-dark">
                              Buy Now
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Price by Form */}
                {Object.keys(retailData.statsByType).filter((k) => k !== "all" && k !== "unknown").length > 0 && (
                  <div className="space-y-3 md:col-span-2">
                    <div>
                      <h3 className="text-sm font-semibold text-heading">Average Price by Form</h3>
                      <p className="text-[10px] text-muted">
                        Based on current stock across tracked retailers
                      </p>
                    </div>

                    <div className="rounded border border-border bg-background-soft p-4 space-y-3.5">
                      {Object.entries(retailData.statsByType).map(([type, stats]: [string, any]) => {
                        if (type === "all" || type === "unknown") return null;
                        const formattedType = type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase());
                        return (
                          <div
                            key={type}
                            className="flex flex-col gap-1 border-b border-border pb-2.5 last:border-0 last:pb-0"
                          >
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-muted">{formattedType}</span>
                              <span className="font-semibold text-heading">
                                £{stats.trimmedMean.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[9px] text-muted">
                              <span>
                                Range: £{stats.min.toFixed(0)} – £{stats.max.toFixed(0)}
                              </span>
                              <span>{stats.count} items</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buyer's Checklist */}
            {data.buyerChecklist && data.buyerChecklist.items.length > 0 && (
              <div className="border-t border-border pt-6">
                <h3 className="mb-1 text-sm font-semibold text-heading">Before You Buy</h3>
                <p className="mb-3 text-[10px] text-muted">Species-specific things to check when evaluating a listing</p>
                <ul className="space-y-2">
                  {data.buyerChecklist.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs leading-relaxed text-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* In the Wild — iNaturalist carousel */}
          <PlantPhotoCarousel slug={data.slug} scientificName={data.scientificName} />

          {/* Morphology + About split */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 font-heading text-lg font-semibold text-heading">Morphology</h2>
              <div className="space-y-3">
                {morphEntries.map(([key, value]) => (
                  <div key={key} className="flex items-baseline justify-between border-b border-border pb-2">
                    <span className="text-xs font-medium capitalize text-muted">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="max-w-[180px] text-right text-sm text-heading">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 font-heading text-lg font-semibold text-heading">About</h2>
              <p className="mb-5 text-sm leading-relaxed text-muted">{data.aboutText}</p>

              <div className="rounded border border-border bg-surface p-4">
                <h4 className="mb-3 font-body text-[10px] font-bold uppercase tracking-[0.14em] text-heading">
                  Climate Profile
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted">Origin</span>
                    <span className="font-medium text-heading">{data.origin}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted">Humidity</span>
                    <span className="font-medium text-heading">{formatHumidity(data.quickFacts.humidity)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted">Temperature</span>
                    <span className="font-medium text-heading">{data.quickFacts.temperature}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted">Light</span>
                    <span className="font-medium text-heading">{data.quickFacts.light}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted">Family</span>
                    <span className="font-medium text-heading">{data.family}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted">Genus</span>
                    <span className="font-medium text-heading">{data.genus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Propagation */}
          {data.propagation && (
            <div className="rounded border border-border bg-surface p-6 md:p-8">
              <div className="-mx-6 -mt-6 mb-6 h-px bg-accent/30 md:-mx-8 md:-mt-8 md:mb-8" />
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                Propagation Guide
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-heading md:text-2xl">
                Growing More Plants
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Methods */}
                <div className="space-y-2">
                  <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                    Methods
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {data.propagation.methods.map((m) => {
                      const slug = PROPAGATION_GUIDE_SLUGS[m];
                      return slug ? (
                        <Link
                          key={m}
                          href={`/guides/propagation/${slug}`}
                          className="rounded-sm border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary underline-offset-2 transition-colors duration-150 hover:border-primary/40 hover:bg-primary/15 hover:underline"
                        >
                          {m}
                        </Link>
                      ) : (
                        <span
                          key={m}
                          className="rounded-sm border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {m}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                    Difficulty
                  </span>
                  <div className="pt-1">
                    <span
                      className={`inline-block rounded-sm px-2.5 py-1 text-xs font-semibold ${
                        data.propagation.difficulty === "Easy"
                          ? "bg-leaf/10 text-leaf"
                          : data.propagation.difficulty === "Moderate"
                          ? "bg-amber-100 text-amber-700"
                          : data.propagation.difficulty === "Challenging"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {data.propagation.difficulty}
                    </span>
                  </div>
                </div>

                {/* Time to established */}
                <div className="space-y-2">
                  <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                    Time to Establish
                  </span>
                  <p className="pt-1 text-sm font-medium text-heading">
                    {data.propagation.timeToEstablished}
                  </p>
                </div>

                {/* Propagates true */}
                {data.propagation.propagatesTrue !== null && (
                  <div className="space-y-2">
                    <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                      True From Cuttings
                    </span>
                    <div className="flex items-center gap-1.5 pt-1">
                      {data.propagation.propagatesTrue ? (
                        <>
                          <svg className="h-4 w-4 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium text-leaf">Yes</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-sm font-medium text-accent">No</span>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] leading-relaxed text-muted">
                      {data.propagation.propagatesTrue
                        ? "Cultivar character is preserved through vegetative cuttings"
                        : "Variegation or cultivar traits may not carry through — select cuttings carefully"}
                    </p>
                  </div>
                )}
              </div>

              {data.propagation.notes && (
                <div className="mt-6 flex items-start gap-3 rounded border border-border bg-background-soft px-4 py-3">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                  </svg>
                  <p className="text-[11px] leading-relaxed text-muted">{data.propagation.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Care Guide */}
          {data.careGuide && (
            <div className="rounded border border-border bg-surface p-6 md:p-8">
              <div className="-mx-6 -mt-6 mb-6 h-px bg-accent/30 md:-mx-8 md:-mt-8 md:mb-8" />
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                Care Guide
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-heading md:text-2xl">
                Growing Conditions
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Substrate",
                    value: data.careGuide.substrate,
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                    ),
                  },
                  {
                    label: "Watering",
                    value: data.careGuide.watering,
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 01-9-9c0-4.07 2.7-7.49 6.37-8.63L12 3l2.63.37C18.3 4.51 21 7.93 21 12a9 9 0 01-9 9z" />
                    ),
                  },
                  {
                    label: "Humidity",
                    value: data.careGuide.humidity,
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                    ),
                  },
                  {
                    label: "Fertilising",
                    value: data.careGuide.fertilising,
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    ),
                  },
                  {
                    label: "Repotting",
                    value: data.careGuide.repotting,
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    ),
                  },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="rounded border border-border bg-background-soft p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 shrink-0 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        {icon}
                      </svg>
                      <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                        {label}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-heading">{value}</p>
                  </div>
                ))}
              </div>

              {data.careGuide.commonProblems.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-heading">Common Problems</h3>
                  <div className="space-y-2">
                    {data.careGuide.commonProblems.map(({ problem, cause, fix }) => (
                      <div key={problem} className="grid grid-cols-1 gap-1 rounded border border-border bg-background-soft p-3.5 sm:grid-cols-3 sm:gap-3">
                        <div>
                          <span className="font-body text-[9px] font-bold uppercase tracking-wider text-muted">Problem</span>
                          <p className="mt-0.5 text-xs font-medium text-heading">{problem}</p>
                        </div>
                        <div>
                          <span className="font-body text-[9px] font-bold uppercase tracking-wider text-muted">Cause</span>
                          <p className="mt-0.5 text-xs text-muted">{cause}</p>
                        </div>
                        <div>
                          <span className="font-body text-[9px] font-bold uppercase tracking-wider text-muted">Fix</span>
                          <p className="mt-0.5 text-xs text-leaf">{fix}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Field Notes */}
          {data.fieldNotes && (
            <div className="relative overflow-hidden rounded border-2 border-border bg-surface p-8">
              <div className="pointer-events-none absolute inset-3 border border-dashed border-border" />
              <div className="absolute left-0 right-0 top-0 h-px bg-accent/40" />

              <div className="relative z-10 px-2 py-1">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <span className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                    Field Notes &middot; Vol. 1
                  </span>
                  <span className="text-xs font-semibold text-muted">
                    {new Date(data.fieldNotes.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h3 className="mb-3 font-heading text-xl font-semibold italic leading-tight text-heading">
                  {data.fieldNotes.title}
                </h3>

                <p className="font-heading text-sm leading-relaxed text-muted">
                  {data.fieldNotes.content}
                </p>

                <div className="mt-6 flex items-center justify-between text-xs text-muted">
                  <span className="italic">Written at AroidAtlas research station</span>
                  <span className="font-heading text-sm font-semibold italic text-heading">
                    &mdash; Aroid Aaron
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="plant-detail-sidebar-col">
          {/* ── AA Price Hero ── */}
          {aaDisplayPrice !== null && (
            <div className="relative overflow-hidden rounded border border-accent/30 bg-accent/8 px-5 py-5">
              <div className="absolute left-0 right-0 top-0 h-px bg-accent/40" />
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-accent/80">
                Aroid Atlas Price Guide
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`font-heading text-3xl font-semibold ${
                    aaDisplayPrice.source === "estimate" ? "text-accent/60" : "text-accent"
                  }`}
                >
                  £{aaDisplayPrice.value.toFixed(0)}
                </span>
                <span className="text-xs text-muted">GBP</span>
                <span
                  className={`ml-auto rounded-sm px-1.5 py-0.5 text-[9px] font-semibold ${
                    priceSampleCount !== null && priceSampleCount < 5
                      ? "bg-amber-100 text-amber-700"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {priceSampleCount !== null && priceSampleCount < 5
                    ? `Low data (${priceSampleCount} sale${priceSampleCount !== 1 ? "s" : ""})`
                    : aaDisplayPrice.source === "ebay"
                    ? `eBay Verified${priceConfidence ? ` · Grade ${priceConfidence}` : ""}`
                    : aaDisplayPrice.source === "retail"
                    ? "Retail Derived"
                    : "Estimate"}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {aaDisplayPrice.source === "ebay"
                  ? "Based on verified eBay UK auction data"
                  : aaDisplayPrice.source === "retail"
                  ? "Based on current UK retail prices"
                  : "Community estimate — limited market data"}
              </p>
              {soldCompsData.length > 0 && (
                <p className="mt-1 text-[10px] text-muted/60">
                  Data as of{" "}
                  {new Date(soldCompsData[soldCompsData.length - 1].date).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
              <a
                href="#market-analysis"
                className="mt-3 inline-flex text-[10px] font-semibold text-accent/70 underline underline-offset-2 transition-colors duration-150 hover:text-accent"
              >
                See full auction data ↓
              </a>
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div className="space-y-3">
            {retailAverage ? (
              <a
                href="#retail-specimens"
                className="flex flex-col justify-between rounded border border-border bg-background-soft p-4 transition-all duration-150 hover:border-primary/40 hover:bg-surface hover:shadow-glass group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                    Retail Price
                  </span>
                  <span className="text-[9px] font-semibold text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    Verify Listings →
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-heading text-2xl font-semibold text-primary">
                    £{retailAverage.value.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-muted">GBP</span>
                </div>
                <span className="mt-2 text-[10px] leading-relaxed text-muted">
                  Trimmed mean across {retailAverage.count} active UK listing{retailAverage.count !== 1 ? "s" : ""}
                </span>
              </a>
            ) : (
              <div className="flex flex-col justify-between rounded border border-border bg-background-soft p-4">
                <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                  Retail Price
                </span>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-heading text-xl font-semibold text-muted/50">Not tracked</span>
                </div>
                <span className="mt-2 text-[10px] leading-relaxed text-muted">
                  Not currently stocked by tracked UK retailers
                </span>
              </div>
            )}

            <div className="flex flex-col justify-between rounded border border-border bg-background-soft p-4">
              <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                Market Trend
              </span>
              <div className="mt-3 flex items-center gap-1.5">
                {liveMarketTrend ? (
                  <>
                    <span
                      className={`font-heading text-base font-semibold ${
                        liveMarketTrend.status === "Rising"
                          ? "text-leaf"
                          : liveMarketTrend.status === "Declining"
                          ? "text-accent-muted"
                          : "text-rarity"
                      }`}
                    >
                      {liveMarketTrend.status}
                    </span>
                    <span className="text-[10px] text-muted">
                      ({liveMarketTrend.changePct > 0 ? "+" : ""}
                      {liveMarketTrend.changePct.toFixed(0)}%)
                    </span>
                  </>
                ) : (
                  <span className="font-heading text-base font-semibold text-muted">—</span>
                )}
              </div>
              <span className="mt-2 text-[10px] leading-relaxed text-muted">
                {liveMarketTrend
                  ? "Direction based on recent vs. earlier eBay weeks"
                  : "Not enough history to calculate a trend"}
              </span>
            </div>

            {showTypicalRange && latestWeek && (
              <div className="flex flex-col justify-between rounded border border-border bg-background-soft p-4">
                <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                  Typical Range
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-heading text-base font-semibold text-heading">
                    £{latestWeek.p25.toFixed(0)}
                  </span>
                  <span className="text-xs text-muted">–</span>
                  <span className="font-heading text-base font-semibold text-heading">
                    £{latestWeek.p75.toFixed(0)}
                  </span>
                </div>
                <span className="mt-2 text-[10px] leading-relaxed text-muted">
                  Middle 50% of recent eBay sale prices
                </span>
              </div>
            )}
          </div>

          {/* Methodology note */}
          <div className="flex items-start gap-3 rounded border border-border bg-background-soft px-4 py-3">
            <svg
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
            </svg>
            <p className="text-[10px] leading-relaxed text-muted">
              <span className="font-semibold text-heading/70">How prices are calculated:</span>{" "}
              The <span className="text-accent/80">AA Price</span> uses verified eBay UK auction data —
              trimmed mean (removing top and bottom 20%) for a fair-value guide. Falls back to UK retail
              average when auction data is unavailable.
            </p>
          </div>

          {/* ── Quick Facts ── */}
          <div className="rounded border border-border bg-surface p-5">
            <div className="-mx-5 -mt-5 mb-4 h-px bg-accent/30" />
            <h3 className="mb-4 font-body text-[10px] font-bold uppercase tracking-[0.14em] text-heading">
              Quick Facts
            </h3>
            <div className="space-y-3">
              {Object.entries(data.quickFacts).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-2">
                  <span className="shrink-0 text-xs capitalize text-muted">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="max-w-[140px] text-right text-xs font-medium text-heading">
                    {key === "humidity" ? formatHumidity(value) : value}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/learn"
              className="mt-5 block w-full rounded-sm bg-primary px-5 py-3 text-center text-sm font-semibold tracking-wide text-surface transition-colors duration-150 hover:bg-primary-dark"
            >
              View Care Guide
            </Link>
          </div>

          <a
            href={`https://www.etsy.com/uk/search?q=${encodeURIComponent(data.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-primary/30 bg-transparent px-5 py-3 text-sm font-semibold text-primary transition-all duration-150 hover:border-primary/50 hover:bg-primary/5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
            </svg>
            Find on Etsy UK
          </a>

          <a
            href={`https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(data.name)}&_sacat=0&LH_BIN=1&_sop=15`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-border bg-transparent px-5 py-3 text-sm font-semibold text-muted transition-all duration-150 hover:border-border-strong hover:text-heading"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Find on eBay UK
          </a>
        </div>
      </div>

      {/* ===== RECOMMENDED PLANTS ===== */}
      <div className="plant-detail-recommended-section">
        <h2 className="mb-6 font-heading text-lg font-semibold text-heading">Similar Plants</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {data.recommendedPlants.map((plant) => {
            const recommendedGenus = (
              plant.genus || plant.name.split(" ")[0].replace(/['"]/g, "")
            ).toLowerCase();
            return (
              <Link
                key={plant.slug}
                href={`/plants/${recommendedGenus}/${plant.slug}`}
                className="group rounded border border-border bg-surface p-4 transition-all duration-150 hover:border-border-strong hover:shadow-glass"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-heading transition-colors duration-150 group-hover:text-primary">
                      {plant.name}
                    </h3>
                    <div className="mt-2">
                      <span className="badge-price">
                        {plant.price} · {getStaticTierLabel(plant.price)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-background-soft">
                    <Image
                      src={`/plants/${recommendedGenus}/${plant.slug}.png`}
                      alt={plant.name}
                      fill
                      className="object-contain object-center transition-transform duration-300 ease-out group-hover:scale-[1.06]"
                      sizes="64px"
                    />
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
