"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";
import PlantPlateImage from "@/components/PlantPlateImage";

interface PlantSummary {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  rarityStatus: string;
  priceGuideTier: string;
  botanicalType: string;
  contentTier: "plate" | "sketch";
  marketStatus: string | null;
  currentMedianPriceGBP: number | null;
}

interface GenusPlantListProps {
  initialPlants: PlantSummary[];
  genus: string;
}

export function getBotanicalTypeDetails(type: string) {
  switch (type?.toLowerCase()) {
    case "species":
      return {
        label: "Wild Species",
        badgeClass: "bg-primary/10 text-primary border-primary/25",
        dotClass: "bg-primary",
        pillClass: "border-primary/25 text-primary/80 hover:bg-primary/8 hover:text-primary",
        activePillClass: "bg-primary/15 text-primary border-primary/35",
      };
    case "hybrid":
      return {
        label: "Horticultural Hybrid",
        badgeClass: "bg-leaf/10 text-leaf border-leaf/20",
        dotClass: "bg-leaf",
        pillClass: "border-leaf/20 text-leaf/80 hover:bg-leaf/8 hover:text-leaf",
        activePillClass: "bg-leaf/15 text-leaf border-leaf/30",
      };
    case "mutation":
      return {
        label: "Sport Mutation",
        badgeClass: "bg-rarity/10 text-rarity border-rarity/20",
        dotClass: "bg-rarity",
        pillClass: "border-rarity/20 text-rarity/80 hover:bg-rarity/8 hover:text-rarity",
        activePillClass: "bg-rarity/15 text-rarity border-rarity/30",
      };
    case "variegated":
      return {
        label: "Variegated Sport",
        badgeClass: "bg-accent/10 text-accent border-accent/25",
        dotClass: "bg-accent",
        pillClass: "border-accent/25 text-accent/80 hover:bg-accent/8 hover:text-accent",
        activePillClass: "bg-accent/15 text-accent border-accent/35",
      };
    case "cultivar":
      return {
        label: "Cultivar Selection",
        badgeClass: "bg-primary-muted/10 text-primary-muted border-primary-muted/20",
        dotClass: "bg-primary-muted",
        pillClass: "border-primary-muted/20 text-primary-muted/80 hover:bg-primary-muted/8 hover:text-primary-muted",
        activePillClass: "bg-primary-muted/15 text-primary-muted border-primary-muted/30",
      };
    default:
      return {
        label: "Variegated Sport",
        badgeClass: "bg-accent/10 text-accent border-accent/25",
        dotClass: "bg-accent",
        pillClass: "border-accent/25 text-accent/80 hover:bg-accent/8 hover:text-accent",
        activePillClass: "bg-accent/15 text-accent border-accent/35",
      };
  }
}

export default function GenusPlantList({ initialPlants, genus }: GenusPlantListProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const counts = initialPlants.reduce(
    (acc, plant) => {
      const type = plant.botanicalType || "variegated";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    { all: initialPlants.length } as Record<string, number>
  );

  const filterOptions = [
    { value: "all", label: "All Plants" },
    { value: "species", label: "Wild Species" },
    { value: "variegated", label: "Variegated" },
    { value: "hybrid", label: "Hybrids" },
    { value: "mutation", label: "Mutations" },
    { value: "cultivar", label: "Cultivars" },
  ];

  const filteredPlants =
    selectedFilter === "all"
      ? initialPlants
      : initialPlants.filter((plant) => (plant.botanicalType || "variegated") === selectedFilter);

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <div className="flex flex-col gap-2">
        <span className="font-body text-xs font-semibold tracking-wider uppercase text-muted">
          Filter by Origin Type
        </span>
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {filterOptions.map((opt) => {
            const count = counts[opt.value] || 0;
            const isSelected = selectedFilter === opt.value;
            const details = opt.value !== "all" ? getBotanicalTypeDetails(opt.value) : null;

            let btnClass = "border border-border text-muted hover:text-heading hover:border-border-strong hover:bg-background-soft";
            if (isSelected) {
              if (opt.value === "all") {
                btnClass = "bg-primary text-surface border-primary";
              } else if (details) {
                btnClass = `border ${details.activePillClass}`;
              }
            } else if (details && count > 0) {
              btnClass = `border ${details.pillClass}`;
            }

            return (
              <button
                key={opt.value}
                onClick={() => setSelectedFilter(opt.value)}
                disabled={count === 0 && !isSelected}
                className={`relative flex shrink-0 select-none items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 ease-in-out hover:-translate-y-0.5 ${btnClass} ${
                  count === 0 ? "cursor-not-allowed border-dashed opacity-35" : "cursor-pointer"
                }`}
              >
                {details && (
                  <span className={`h-1.5 w-1.5 rounded-full ${details.dotClass}`} />
                )}
                <span>{opt.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    isSelected
                      ? opt.value === "all"
                        ? "bg-surface/20 text-surface"
                        : "bg-heading/8 text-heading"
                      : "bg-border/50 text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filteredPlants.length === 0 ? (
        <div className="rounded border border-dashed border-border py-20 text-center">
          <p className="text-muted">No plants found matching this filter.</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
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
                    href={`/plants/${genus}/${plant.slug}`}
                    className="group block overflow-hidden rounded-xl border border-border/40 bg-surface shadow-card-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-95 hover:border-border-strong hover:shadow-glass"
                  >
                    {/* Image area */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-background-soft">
                      <PlantPlateImage
                        src={`/plants/${genus}/${plant.slug}.png`}
                        alt={plant.commonName}
                        scientificName={plant.scientificName}
                        botanicalType={plant.botanicalType}
                        contentTier={plant.contentTier}
                        size="card"
                        className="object-contain object-center transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* Warm ivory gradient at the base for text */}
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-surface via-surface/80 to-transparent" />

                      {/* Botanical type badge — bottom-left */}
                      <div className="absolute bottom-4 left-4">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${details.badgeClass}`}>
                          <span className={`h-1 w-1 rounded-full ${details.dotClass}`} />
                          {details.label}
                        </span>
                      </div>
                    </div>

                    {/* Card info section */}
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
                              plant.marketStatus === "Rising"
                                ? "border-leaf/20 bg-leaf/10 text-leaf"
                                : plant.marketStatus === "Declining"
                                ? "border-rarity/20 bg-rarity/8 text-rarity"
                                : "border-border bg-background-soft text-muted"
                            }`}
                          >
                            {plant.marketStatus === "Rising" ? "↑" : plant.marketStatus === "Declining" ? "↓" : "→"}
                            {" "}{plant.marketStatus}
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
  );
}
