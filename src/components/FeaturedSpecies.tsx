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
        <div className="relative aspect-[3/4] overflow-hidden bg-forest-dark/60">
          {/* Full botanical plate, unclipped */}
          <Image
            src={`/plants/${plant.genus.toLowerCase()}/${plant.slug}.png`}
            alt={plant.commonName}
            fill
            className="object-contain object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 25vw"
          />

          {/* Bottom gradient overlay for text legibility */}
          <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-forest-dark via-forest-dark/80 to-transparent pointer-events-none" />

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
    <section className="relative section-spacing">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
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