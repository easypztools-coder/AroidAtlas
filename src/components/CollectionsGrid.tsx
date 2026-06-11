"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { collections } from "@/lib/mock-data";

function CollectionCard({
  collection,
  index,
}: {
  collection: (typeof collections)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
    >
      <Link
        href={`/collections/${collection.slug}`}
        className="glass-card-hover group relative flex h-48 flex-col overflow-hidden rounded-2xl"
      >
        {/* Background gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${collection.gradient} to-card`}
        />

        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative mt-auto p-5">
          <h3 className="text-base font-heading font-bold text-heading group-hover:text-primary transition-colors duration-300">
            {collection.name}
          </h3>
          <p className="mt-1 text-xs text-muted line-clamp-2">
            {collection.description}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="badge-primary text-[10px]">
              {collection.plantCount} plants
            </span>
            <svg
              className="h-3.5 w-3.5 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
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

export default function CollectionsGrid() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="section-heading">Popular Collections</h2>
          <p className="section-subheading mt-3">
            Curated groupings for every collecting passion.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((collection, i) => (
            <CollectionCard key={collection.slug} collection={collection} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}