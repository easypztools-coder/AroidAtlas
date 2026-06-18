"use client";

import Link from "next/link";
import Image from "next/image";
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
        <div className="relative aspect-[3/4] overflow-hidden bg-card">
          {/* Spotlight Plant Plate Image */}
          <Image
            src={`/api/plant-image?genus=${plant.genus.toLowerCase()}&slug=${plant.slug}`}
            alt={plant.commonName}
            fill
            className="object-cover object-center scale-[1.3] transition-all duration-700 ease-out group-hover:scale-[1.4] opacity-80 group-hover:opacity-100 filter brightness-95 group-hover:brightness-105"
            sizes="(max-width: 768px) 100vw, 25vw"
          />

          {/* Spotlight Reveal Overlay (hides margins/text and exposes center specimen) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(17,26,21,0.45)_45%,rgba(17,26,21,0.9)_75%,#111A15_100%)] transition-all duration-700 ease-out group-hover:scale-105 pointer-events-none" />

          {/* Soft ambient green light underneath */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(195,217,161,0.08)_0%,transparent_60%)] pointer-events-none" />

          {/* Bottom gradient overlay for text legibility */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-card via-card/75 to-transparent pointer-events-none" />

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