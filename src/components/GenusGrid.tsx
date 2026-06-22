"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { genera } from "@/lib/mock-data";

const GENUS_REPRESENTATIVES: Record<string, { genus: string; slug: string }> = {
  philodendron: { genus: "philodendron", slug: "spiritus-sancti" },
  anthurium: { genus: "anthurium", slug: "delta-force" },
  monstera: { genus: "monstera", slug: "devil-monster" },
  alocasia: { genus: "alocasia", slug: "venom" },
  begonia: { genus: "begonia", slug: "pavonina" },
  rhaphidophora: { genus: "other", slug: "rhaphidophora-cryptantha-variegated" },
  scindapsus: { genus: "other", slug: "scindapsus-treubii-moonlight-variegated" },
};

function GenusCard({
  genus,
  index,
}: {
  genus: (typeof genera)[number];
  index: number;
}) {
  const representative = GENUS_REPRESENTATIVES[genus.slug];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
    >
      <Link
        href={`/plants/${genus.slug}`}
        className="glass-card-hover group relative flex h-64 w-64 md:h-72 md:w-72 shrink-0 flex-col overflow-hidden rounded-2xl"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-forest-deep via-card to-forest-dark" />

        {representative ? (
          <>
            {/* Specimen image with zoom-on-hover */}
            <Image
              src={`/api/plant-image?genus=${representative.genus}&slug=${representative.slug}`}
              alt={`${genus.name} representative`}
              fill
              className="object-cover object-center scale-[1.3] transition-all duration-700 ease-out group-hover:scale-[1.4] opacity-40 group-hover:opacity-60 filter brightness-90 group-hover:brightness-100"
              sizes="(max-width: 768px) 256px, 288px"
            />
            {/* Premium spotlight reveal overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(17,26,21,0.5)_50%,rgba(17,26,21,0.95)_85%,#111A15_100%)] transition-all duration-700 ease-out group-hover:scale-105 pointer-events-none" />
          </>
        ) : (
          /* Decorative SVG pattern for fallback (e.g. Homalomena) */
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,rgba(195,217,161,0.12)_0%,transparent_70%)]">
            <svg className="h-full w-full" viewBox="0 0 200 200" fill="none">
              <path
                d="M100 180C100 180 50 130 50 80C50 40 75 20 100 15C125 20 150 40 150 80C150 130 100 180 100 180Z"
                fill="currentColor"
                opacity="0.3"
                className="text-primary"
              />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="relative mt-auto p-6 z-10 bg-gradient-to-t from-forest-dark via-forest-dark/40 to-transparent pt-12">
          <h3 className="text-lg font-heading font-bold text-heading group-hover:text-primary transition-colors duration-300">
            {genus.name}
          </h3>
          <p className="mt-1 text-xs text-muted line-clamp-2">{genus.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="badge-primary">{genus.speciesCount} species</span>
            <svg
              className="h-4 w-4 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function GenusGrid() {
  return (
    <section className="relative section-spacing overflow-hidden">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="section-heading">Explore by Genus</h2>
          <p className="section-subheading mt-3">
            Dive into the remarkable diversity of the Araceae family.
          </p>
        </motion.div>

        {/* Horizontal scrollable grid */}
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none -mx-6 px-6">
          {genera.map((genus, i) => (
            <div key={genus.slug} className="snap-start shrink-0">
              <GenusCard genus={genus} index={i} />
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted/50">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <span>Scroll to explore more genera</span>
        </div>
      </div>
    </section>
  );
}