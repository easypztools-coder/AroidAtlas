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
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    >
      <Link
        href={`/plants/${genus.slug}`}
        className="group relative flex h-64 w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border/40 bg-surface shadow-card-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-95 hover:border-border-strong hover:shadow-glass md:h-72 md:w-72"
      >
        {/* Warm background base */}
        <div className="absolute inset-0 bg-background-soft" />

        {representative ? (
          <Image
            src={`/plants/${representative.genus}/${representative.slug}.png`}
            alt={`${genus.name} representative`}
            fill
            className="object-contain object-center transition-transform duration-500 ease-out group-hover:scale-[1.015]"
            sizes="(max-width: 768px) 256px, 288px"
          />
        ) : (
          /* Placeholder for genera without a representative image */
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <svg className="h-24 w-24 text-primary" viewBox="0 0 200 200" fill="none">
              <path
                d="M100 180C100 180 50 130 50 80C50 40 75 20 100 15C125 20 150 40 150 80C150 130 100 180 100 180Z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}

        {/* Bottom warm-ivory gradient overlay for text */}
        <div className="relative mt-auto p-5 z-10 bg-gradient-to-t from-surface via-surface/90 to-transparent pt-10">
          {/* Fine brass rule */}
          <div className="mb-2.5 h-px w-full bg-accent/15" />
          <h3 className="font-heading text-base font-semibold italic text-heading transition-colors duration-150 group-hover:text-primary">
            {genus.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted">{genus.description}</p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="badge-primary">{genus.speciesCount} species</span>
            <svg
              className="h-3.5 w-3.5 text-muted transition-transform duration-200 group-hover:translate-x-0.5"
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
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-accent/60" />
            <p className="font-body text-xs font-semibold tracking-wider uppercase text-accent">
              Browse by Genus
            </p>
          </div>
          <h2 className="section-heading">Explore by Genus</h2>
          <p className="section-subheading mt-3">
            Dive into the remarkable diversity of the Araceae family — from velvety Anthuriums to fenestrated Monsteras.
          </p>
        </motion.div>

        {/* Horizontal scrollable genus row */}
        <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory">
          {genera.map((genus, i) => (
            <div key={genus.slug} className="snap-start shrink-0">
              <GenusCard genus={genus} index={i} />
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-muted/60">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <span>Scroll to explore more genera</span>
        </div>
      </div>
    </section>
  );
}
