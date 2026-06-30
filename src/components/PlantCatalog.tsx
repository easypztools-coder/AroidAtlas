"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";
import { getBotanicalTypeDetails } from "@/components/GenusPlantList";

export interface CatalogPlant {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  genus: string;
  genusLabel: string;
  rarityStatus: string;
  priceGuideTier: string;
  botanicalType: string;
  marketStatus: string | null;
  currentMedianPriceGBP: number | null;
}

interface PlantCatalogProps {
  plants: CatalogPlant[];
}

const RARITY_ORDER = ["Extremely Rare", "Ultra Rare", "Very Rare", "Rare", "Uncommon", "Common"];
const MARKET_STATUS_OPTIONS = ["Volatile", "Stable"];

function toggleInSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <span className="font-body text-xs font-semibold tracking-wider uppercase text-muted">
        {title}
      </span>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={count === 0}
      className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all duration-300 ease-in-out hover:-translate-y-0.5 ${
        checked
          ? "border-primary/35 bg-primary/10 text-heading"
          : "border-border/40 bg-surface text-muted hover:border-border-strong hover:text-heading"
      } ${count === 0 ? "cursor-not-allowed opacity-35" : "cursor-pointer"}`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
            checked ? "border-primary bg-primary" : "border-border-strong bg-transparent"
          }`}
        >
          {checked && (
            <svg className="h-2.5 w-2.5 text-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        {label}
      </span>
      <span
        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
          checked ? "bg-primary/15 text-primary" : "bg-border/50 text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export default function PlantCatalog({ plants }: PlantCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenera, setSelectedGenera] = useState<Set<string>>(new Set());
  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
  const [selectedMarketStatuses, setSelectedMarketStatuses] = useState<Set<string>>(new Set());

  const genusOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const plant of plants) {
      const existing = counts.get(plant.genus);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(plant.genus, { label: plant.genusLabel, count: 1 });
      }
    }
    return Array.from(counts.entries())
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [plants]);

  const rarityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const plant of plants) {
      counts.set(plant.rarityStatus, (counts.get(plant.rarityStatus) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        const ai = RARITY_ORDER.indexOf(a.value);
        const bi = RARITY_ORDER.indexOf(b.value);
        return (ai === -1 ? RARITY_ORDER.length : ai) - (bi === -1 ? RARITY_ORDER.length : bi);
      });
  }, [plants]);

  const marketStatusOptions = useMemo(() => {
    return MARKET_STATUS_OPTIONS.map((status) => ({
      value: status,
      count: plants.filter((p) => p.marketStatus === status).length,
    }));
  }, [plants]);

  const filteredPlants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return plants.filter((plant) => {
      if (selectedGenera.size > 0 && !selectedGenera.has(plant.genus)) return false;
      if (selectedRarities.size > 0 && !selectedRarities.has(plant.rarityStatus)) return false;
      if (selectedMarketStatuses.size > 0 && !selectedMarketStatuses.has(plant.marketStatus || "")) return false;
      if (q.length > 0) {
        const haystack = `${plant.scientificName} ${plant.commonName} ${plant.name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [plants, searchQuery, selectedGenera, selectedRarities, selectedMarketStatuses]);

  const activeFilterCount =
    selectedGenera.size + selectedRarities.size + selectedMarketStatuses.size + (searchQuery.trim() ? 1 : 0);

  function clearFilters() {
    setSearchQuery("");
    setSelectedGenera(new Set());
    setSelectedRarities(new Set());
    setSelectedMarketStatuses(new Set());
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
      {/* ── Sidebar ── */}
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-border/40 bg-surface p-5 shadow-card-sm space-y-6">
          <div className="-mx-5 -mt-5 mb-1 h-px bg-accent/10" />

          {/* Search */}
          <div className="space-y-2">
            <span className="font-body text-xs font-semibold tracking-wider uppercase text-muted">
              Search
            </span>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full rounded-xl border border-border/40 bg-background-soft py-2 pl-9 pr-3 text-sm text-heading placeholder-muted/50 outline-none transition-all duration-300 focus:border-primary/30 focus:shadow-glow"
              />
            </div>
          </div>

          <FilterSection title="Genus">
            {genusOptions.map((opt) => (
              <FilterCheckbox
                key={opt.value}
                label={opt.label}
                count={opt.count}
                checked={selectedGenera.has(opt.value)}
                onChange={() => setSelectedGenera((prev) => toggleInSet(prev, opt.value))}
              />
            ))}
          </FilterSection>

          <FilterSection title="Rarity Status">
            {rarityOptions.map((opt) => (
              <FilterCheckbox
                key={opt.value}
                label={opt.value}
                count={opt.count}
                checked={selectedRarities.has(opt.value)}
                onChange={() => setSelectedRarities((prev) => toggleInSet(prev, opt.value))}
              />
            ))}
          </FilterSection>

          <FilterSection title="Market Status">
            {marketStatusOptions.map((opt) => (
              <FilterCheckbox
                key={opt.value}
                label={opt.value}
                count={opt.count}
                checked={selectedMarketStatuses.has(opt.value)}
                onChange={() => setSelectedMarketStatuses((prev) => toggleInSet(prev, opt.value))}
              />
            ))}
          </FilterSection>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-xl border border-border/40 px-3 py-2 text-xs font-semibold text-muted transition-all duration-300 ease-in-out hover:border-border-strong hover:text-heading hover:-translate-y-0.5"
            >
              Clear All Filters ({activeFilterCount})
            </button>
          )}
        </div>
      </aside>

      {/* ── Results ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted">
            Showing {filteredPlants.length} of {plants.length} plants
          </span>
        </div>

        {filteredPlants.length === 0 ? (
          <div className="rounded border border-dashed border-border py-20 text-center">
            <p className="text-muted">No plants found matching these filters.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredPlants.map((plant) => {
                const details = getBotanicalTypeDetails(plant.botanicalType);

                return (
                  <motion.div
                    key={plant.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Link
                      href={`/plants/${plant.genus}/${plant.slug}`}
                      className="group block overflow-hidden rounded-xl border border-border/40 bg-surface shadow-card-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-95 hover:border-border-strong hover:shadow-glass"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-background-soft">
                        <Image
                          src={`/plants/${plant.genus}/${plant.slug}.png`}
                          alt={plant.commonName}
                          fill
                          className="object-contain object-center transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/plant-placeholder.png";
                          }}
                        />
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-surface via-surface/80 to-transparent" />

                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-surface/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">
                            {plant.genusLabel}
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${details.badgeClass}`}>
                            <span className={`h-1 w-1 rounded-full ${details.dotClass}`} />
                            {details.label}
                          </span>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-3">
                        <div className="mb-2.5 h-px w-full bg-accent/15" />
                        <h3 className="font-heading text-[15px] font-semibold italic leading-snug text-heading transition-colors duration-150 group-hover:text-primary line-clamp-2">
                          {plant.scientificName}
                        </h3>
                        <p className="mt-0.5 truncate text-[11px] text-muted">{plant.commonName}</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="badge-price">
                            {plant.currentMedianPriceGBP
                              ? `£${plant.currentMedianPriceGBP.toFixed(0)} AA Price`
                              : `${plant.priceGuideTier} · ${getStaticTierLabel(plant.priceGuideTier)}`}
                          </span>
                          {plant.marketStatus && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold ${
                                plant.marketStatus === "Volatile"
                                  ? "border-rarity/20 bg-rarity/8 text-rarity"
                                  : plant.marketStatus === "Stable"
                                  ? "border-leaf/20 bg-leaf/10 text-leaf"
                                  : "border-border bg-background-soft text-muted"
                              }`}
                            >
                              {plant.marketStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
