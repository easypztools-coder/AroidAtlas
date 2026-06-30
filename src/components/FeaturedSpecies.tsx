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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="h-full"
    >
      <Link
        href={`/plants/${plant.genus.toLowerCase()}/${plant.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-surface shadow-card-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-95 hover:border-border-strong hover:shadow-glass"
      >
        {/* Image Area — fixed aspect ratio, always same height */}
        <div className="relative aspect-[3/4] overflow-hidden bg-background-soft">
          <Image
            src={`/plants/${plant.genus.toLowerCase()}/${plant.slug}.png`}
            alt={plant.commonName}
            fill
            className="object-contain object-center transition-transform duration-500 ease-out group-hover:scale-[1.015]"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
          {/* Warm ivory fade at base */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-surface to-transparent" />
        </div>

        {/* Card Info — flex-col so bottom row is always at the same position */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
          {/* Fine brass rule */}
          <div className="mb-3 h-px w-full bg-accent/20" />
          <h3 className="font-heading text-[15px] font-semibold italic leading-snug text-heading transition-colors duration-150 group-hover:text-primary">
            {plant.scientificName}
          </h3>
          {/* mt-auto pushes this row to the bottom regardless of name length */}
          <div className="mt-auto flex items-center justify-between pt-2">
            <p className="text-[11px] text-muted">{plant.commonName}</p>
            <span className="badge-price">
              {plant.priceGuideTier} · {getStaticTierLabel(plant.priceGuideTier)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedSpecies() {
  const displayPlants = featuredPlants.slice(0, 4);

  return (
    <section className="relative section-spacing bg-background-soft">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-accent/60" />
            <p className="font-body text-xs font-semibold tracking-wider uppercase text-accent">
              Featured Species
            </p>
          </div>
          <h2 className="section-heading">Exceptional Specimens</h2>
          <p className="section-subheading mt-3">
            Curated selections from the atlas — representing the breadth and rarity of the Araceae family.
          </p>
        </motion.div>

        {/* Plant Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displayPlants.map((plant, i) => (
            <PlantCard key={plant.slug} plant={plant} index={i} />
          ))}
        </div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/plants"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted underline underline-offset-4 transition-all duration-300 ease-in-out hover:text-heading hover:-translate-y-0.5"
          >
            View all species in the atlas
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
