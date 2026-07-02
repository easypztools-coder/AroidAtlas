"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface SearchPlant {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  genus: string;
  genusSlug: string;
  rarityStatus: string;
  priceGuideTier: string;
  botanicalType: string;
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
  genusSlug: string;
  species: string;
  origin: string;
  collectorPopularity: number;
  rarityStatus: string;
  availability: string;
  priceGuideTier: string;
  aboutText: string;
  quickFacts: {
    growthHabit: string;
    matureSize: string;
    light: string;
    humidity: string;
    temperature: string;
    difficulty: string;
    growthSpeed: string;
  };
  morphology: {
    leafShape: string;
    leafLength: string;
    leafWidth: string;
    petioleColor: string;
    venation: string;
    texture: string;
    variegation: string;
  };
  marketMetrics: {
    currentMedianPriceGBP: number | null;
    threeMonthChangePercent: number | null;
    marketStatus: string | null;
  };
}

export default function ComparePage() {
  const [plantsList, setPlantsList] = useState<SearchPlant[]>([]);
  const [plantA, setPlantA] = useState<PlantData | null>(null);
  const [plantB, setPlantB] = useState<PlantData | null>(null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [dropdownAOpen, setDropdownAOpen] = useState(false);
  const [dropdownBOpen, setDropdownBOpen] = useState(false);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  useEffect(() => {
    fetch("/api/plants")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlantsList(data);
        }
      })
      .catch((err) => console.error("Failed to load plants for compare:", err));
  }, []);

  const selectPlant = async (plant: SearchPlant, target: "A" | "B") => {
    if (target === "A") {
      setDropdownAOpen(false);
      setLoadingA(true);
      setSearchA("");
    } else {
      setDropdownBOpen(false);
      setLoadingB(true);
      setSearchB("");
    }

    try {
      const res = await fetch(`/api/plants/detail?genus=${plant.genusSlug}&slug=${plant.slug}`);
      const data = await res.json();
      if (target === "A") {
        setPlantA(data);
      } else {
        setPlantB(data);
      }
    } catch (err) {
      console.error(`Failed to load plant ${plant.slug}:`, err);
    } finally {
      if (target === "A") setLoadingA(false);
      else setLoadingB(false);
    }
  };

  const filteredA = plantsList.filter(
    (p) =>
      p.scientificName.toLowerCase().includes(searchA.toLowerCase()) ||
      p.commonName.toLowerCase().includes(searchA.toLowerCase())
  );

  const filteredB = plantsList.filter(
    (p) =>
      p.scientificName.toLowerCase().includes(searchB.toLowerCase()) ||
      p.commonName.toLowerCase().includes(searchB.toLowerCase())
  );

  return (
    <div className="section-spacing">
      <div className="section-container">
        {/* Header Block */}
        <div className="mb-12 max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-heading mb-4">
            Specimen Comparison Tool
          </h1>
          <p className="text-sm md:text-base text-muted leading-relaxed">
            Select two tropical aroids from our database to compare their care demands, botanical taxonomy, leaf morphology, and real-world market values side-by-side.
          </p>
        </div>

        {/* Selection Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Selector A */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
              Select Specimen A
            </label>
            <button
              onClick={() => setDropdownAOpen(!dropdownAOpen)}
              className="w-full text-left glass-card-hover px-4 py-3 text-sm text-heading font-medium flex justify-between items-center"
            >
              <span className="italic truncate">
                {loadingA ? "Loading..." : plantA ? plantA.scientificName : "Choose a plant species..."}
              </span>
              <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {dropdownAOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-primary/10 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
                <input
                  type="text"
                  placeholder="Type to filter..."
                  value={searchA}
                  onChange={(e) => setSearchA(e.target.value)}
                  className="w-full bg-background/50 border-b border-primary/5 px-4 py-3 text-xs text-heading placeholder-muted outline-none"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredA.slice(0, 10).map((plant) => (
                    <button
                      key={plant.slug}
                      onClick={() => selectPlant(plant, "A")}
                      className="w-full px-4 py-2.5 text-left text-xs italic text-muted hover:text-primary hover:bg-primary/5 transition-colors border-b border-primary/5 last:border-0"
                    >
                      {plant.scientificName} <span className="not-italic text-muted-light">({plant.commonName})</span>
                    </button>
                  ))}
                  {filteredA.length === 0 && (
                    <p className="p-4 text-xs text-muted italic text-center">No matching plants found.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selector B */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
              Select Specimen B
            </label>
            <button
              onClick={() => setDropdownBOpen(!dropdownBOpen)}
              className="w-full text-left glass-card-hover px-4 py-3 text-sm text-heading font-medium flex justify-between items-center"
            >
              <span className="italic truncate">
                {loadingB ? "Loading..." : plantB ? plantB.scientificName : "Choose a plant species..."}
              </span>
              <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {dropdownBOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-primary/10 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
                <input
                  type="text"
                  placeholder="Type to filter..."
                  value={searchB}
                  onChange={(e) => setSearchB(e.target.value)}
                  className="w-full bg-background/50 border-b border-primary/5 px-4 py-3 text-xs text-heading placeholder-muted outline-none"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredB.slice(0, 10).map((plant) => (
                    <button
                      key={plant.slug}
                      onClick={() => selectPlant(plant, "B")}
                      className="w-full px-4 py-2.5 text-left text-xs italic text-muted hover:text-primary hover:bg-primary/5 transition-colors border-b border-primary/5 last:border-0"
                    >
                      {plant.scientificName} <span className="not-italic text-muted-light">({plant.commonName})</span>
                    </button>
                  ))}
                  {filteredB.length === 0 && (
                    <p className="p-4 text-xs text-muted italic text-center">No matching plants found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-12">
          {/* Specimen A Card Preview */}
          <div className="glass-card p-6 min-h-[160px] flex flex-col justify-between">
            {plantA ? (
              <div className="flex gap-4 sm:gap-6 items-start">
                <div className="flex-1 min-w-0">
                  <span className="badge-primary mb-2 capitalize">{plantA.genus}</span>
                  <h3 className="text-xl font-heading font-bold text-heading italic truncate">{plantA.scientificName}</h3>
                  <p className="text-xs text-muted mt-1 truncate">{plantA.commonName}</p>
                  <p className="text-xs text-muted-light leading-relaxed mt-4 line-clamp-2">{plantA.aboutText}</p>
                  <Link
                    href={`/plants/${plantA.genusSlug}/${plantA.slug}`}
                    className="mt-6 inline-flex text-xs font-semibold text-primary hover:underline items-center gap-1.5"
                  >
                    View full profile
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
                {/* Minimised Botanical Plate */}
                <div className="relative w-20 sm:w-24 shrink-0 aspect-[3/4] overflow-hidden rounded border border-border bg-background-soft shadow-sm group">
                  <Image
                    src={`/plants/${plantA.genusSlug}/${plantA.slug}.png`}
                    alt={plantA.commonName}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 80px, 96px"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/plant-placeholder.png";
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xs text-muted italic">No plant selected for slot A.</p>
              </div>
            )}
          </div>

          {/* Specimen B Card Preview */}
          <div className="glass-card p-6 min-h-[160px] flex flex-col justify-between">
            {plantB ? (
              <div className="flex gap-4 sm:gap-6 items-start">
                <div className="flex-1 min-w-0">
                  <span className="badge-primary mb-2 capitalize">{plantB.genus}</span>
                  <h3 className="text-xl font-heading font-bold text-heading italic truncate">{plantB.scientificName}</h3>
                  <p className="text-xs text-muted mt-1 truncate">{plantB.commonName}</p>
                  <p className="text-xs text-muted-light leading-relaxed mt-4 line-clamp-2">{plantB.aboutText}</p>
                  <Link
                    href={`/plants/${plantB.genusSlug}/${plantB.slug}`}
                    className="mt-6 inline-flex text-xs font-semibold text-primary hover:underline items-center gap-1.5"
                  >
                    View full profile
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
                {/* Minimised Botanical Plate */}
                <div className="relative w-20 sm:w-24 shrink-0 aspect-[3/4] overflow-hidden rounded border border-border bg-background-soft shadow-sm group">
                  <Image
                    src={`/plants/${plantB.genusSlug}/${plantB.slug}.png`}
                    alt={plantB.commonName}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 80px, 96px"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/plant-placeholder.png";
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xs text-muted italic">No plant selected for slot B.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Comparison Table */}
        {plantA && plantB ? (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-primary/5 border-b border-primary/10">
                  <th className="p-4 font-bold uppercase tracking-wider text-muted w-1/4">Metric</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-primary italic w-3/8">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-10 shrink-0 overflow-hidden rounded border border-border bg-background-soft">
                        <Image
                          src={`/plants/${plantA.genusSlug}/${plantA.slug}.png`}
                          alt={plantA.commonName}
                          fill
                          className="object-contain"
                          sizes="32px"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/plant-placeholder.png";
                          }}
                        />
                      </div>
                      <span className="truncate">{plantA.scientificName}</span>
                    </div>
                  </th>
                  <th className="p-4 font-bold uppercase tracking-wider text-primary italic w-3/8">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-10 shrink-0 overflow-hidden rounded border border-border bg-background-soft">
                        <Image
                          src={`/plants/${plantB.genusSlug}/${plantB.slug}.png`}
                          alt={plantB.commonName}
                          fill
                          className="object-contain"
                          sizes="32px"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/plant-placeholder.png";
                          }}
                        />
                      </div>
                      <span className="truncate">{plantB.scientificName}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-muted-light">
                {/* Section Header: Taxonomy */}
                <tr className="bg-card/40">
                  <td colSpan={3} className="p-3 font-semibold text-heading text-[10px] uppercase tracking-wider">
                    Taxonomy & Origin
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Genus</td>
                  <td className="p-4 text-heading capitalize">{plantA.genus}</td>
                  <td className="p-4 text-heading capitalize">{plantB.genus}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Family</td>
                  <td className="p-4 text-heading">{plantA.family}</td>
                  <td className="p-4 text-heading">{plantB.family}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Origin</td>
                  <td className="p-4 text-heading">{plantA.origin}</td>
                  <td className="p-4 text-heading">{plantB.origin}</td>
                </tr>

                {/* Section Header: Morphology */}
                <tr className="bg-card/40">
                  <td colSpan={3} className="p-3 font-semibold text-heading text-[10px] uppercase tracking-wider">
                    Foliage Morphology
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Leaf Shape</td>
                  <td className="p-4 text-heading">{plantA.morphology.leafShape}</td>
                  <td className="p-4 text-heading">{plantB.morphology.leafShape}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Mature Dimensions</td>
                  <td className="p-4 text-heading">Up to {plantA.morphology.leafLength} long ({plantA.morphology.leafWidth} wide)</td>
                  <td className="p-4 text-heading">Up to {plantB.morphology.leafLength} long ({plantB.morphology.leafWidth} wide)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Leaf Texture</td>
                  <td className="p-4 text-heading">{plantA.morphology.texture}</td>
                  <td className="p-4 text-heading">{plantB.morphology.texture}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Variegation</td>
                  <td className="p-4 text-heading">{plantA.morphology.variegation}</td>
                  <td className="p-4 text-heading">{plantB.morphology.variegation}</td>
                </tr>

                {/* Section Header: Care */}
                <tr className="bg-card/40">
                  <td colSpan={3} className="p-3 font-semibold text-heading text-[10px] uppercase tracking-wider">
                    Care & Cultivation
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Growth Difficulty</td>
                  <td className="p-4 text-heading">{plantA.quickFacts.difficulty}</td>
                  <td className="p-4 text-heading">{plantB.quickFacts.difficulty}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Growth Speed</td>
                  <td className="p-4 text-heading">{plantA.quickFacts.growthSpeed}</td>
                  <td className="p-4 text-heading">{plantB.quickFacts.growthSpeed}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Growth Habit</td>
                  <td className="p-4 text-heading">{plantA.quickFacts.growthHabit}</td>
                  <td className="p-4 text-heading">{plantB.quickFacts.growthHabit}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Light Demands</td>
                  <td className="p-4 text-heading">{plantA.quickFacts.light}</td>
                  <td className="p-4 text-heading">{plantB.quickFacts.light}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Humidity Needs</td>
                  <td className="p-4 text-heading">{plantA.quickFacts.humidity}</td>
                  <td className="p-4 text-heading">{plantB.quickFacts.humidity}</td>
                </tr>

                {/* Section Header: Pricing */}
                <tr className="bg-card/40">
                  <td colSpan={3} className="p-3 font-semibold text-heading text-[10px] uppercase tracking-wider">
                    Market Economics
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Rarity Status</td>
                  <td className="p-4 text-primary font-semibold">{plantA.rarityStatus}</td>
                  <td className="p-4 text-primary font-semibold">{plantB.rarityStatus}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Price Guide Tier</td>
                  <td className="p-4 text-heading">
                    <span className="badge-price">{plantA.priceGuideTier}</span>
                  </td>
                  <td className="p-4 text-heading">
                    <span className="badge-price">{plantB.priceGuideTier}</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted">Market Trend</td>
                  <td className="p-4">
                    {plantA.marketMetrics.marketStatus ? (
                      <span className={plantA.marketMetrics.marketStatus === "Rising" ? "text-green-400 font-bold" : "text-orange-400 font-bold"}>
                        {plantA.marketMetrics.marketStatus} ({plantA.marketMetrics.threeMonthChangePercent}% 90d)
                      </span>
                    ) : (
                      <span className="text-muted italic">Stable</span>
                    )}
                  </td>
                  <td className="p-4">
                    {plantB.marketMetrics.marketStatus ? (
                      <span className={plantB.marketMetrics.marketStatus === "Rising" ? "text-green-400 font-bold" : "text-orange-400 font-bold"}>
                        {plantB.marketMetrics.marketStatus} ({plantB.marketMetrics.threeMonthChangePercent}% 90d)
                      </span>
                    ) : (
                      <span className="text-muted italic">Stable</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-muted border border-dashed border-primary/10">
            <svg className="mx-auto h-8 w-8 text-muted/60 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs italic">
              Please select a species in both slots A and B to load the side-by-side comparison table.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
