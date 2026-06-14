"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { featuredPlants } from "@/lib/mock-data";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";

function PlantCard({
  plant,
  index,
}: {
  plant: (typeof featuredPlants)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
    >
      <Link
        href={`/plants/${plant.genus.toLowerCase()}/${plant.slug}`}
        className="glass-card-glow group block overflow-hidden rounded-2xl"
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-forest-deep to-card">
          {/* SVG Plant Silhouette Placeholder */}
          <div className="flex h-full w-full items-center justify-center p-6">
            <svg
              className="h-full w-full text-primary/15 transition-all duration-500 group-hover:scale-105 group-hover:text-primary/25"
              viewBox="0 0 200 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 260C100 260 45 190 45 125C45 65 72 30 100 20C128 30 155 65 155 125C155 190 100 260 100 260Z"
                fill="currentColor"
                opacity="0.35"
              />
              <path
                d="M100 230C100 230 60 175 60 125C60 80 82 50 100 40C118 50 140 80 140 125C140 175 100 230 100 230Z"
                fill="currentColor"
                opacity="0.25"
              />
              <line
                x1="100"
                y1="260"
                x2="100"
                y2="20"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.2"
              />
            </svg>
          </div>

          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-card via-card/80 to-transparent" />

          {/* Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-sm font-heading font-bold text-heading italic group-hover:text-primary transition-colors duration-300">
              {plant.scientificName}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-price/15 px-2 py-0.5 text-[10px] font-medium text-price">
                {plant.priceGuideTier} · {getStaticTierLabel(plant.priceGuideTier)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedSpecies() {
  // Show first 4 plants for the featured grid
  const displayPlants = featuredPlants.slice(0, 4);

  return (
    <section className="relative py-20 md:py-28">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="section-heading">Featured Species</h2>
          <p className="section-subheading mt-3">
            Exceptional specimens curated for the discerning collector.
          </p>
        </motion.div>

        {/* Plant Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayPlants.map((plant, i) => (
            <PlantCard key={plant.slug} plant={plant} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}