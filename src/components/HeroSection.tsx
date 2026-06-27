"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";

interface SearchPlant {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  genus: string;
  rarityStatus: string;
  priceGuideTier: string;
}

function StatCard({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
      className="flex flex-col items-center gap-1 border-r border-border px-5 py-2 text-center last:border-r-0"
    >
      <span className="font-heading text-xl font-semibold text-heading tabular-nums">{value}</span>
      <span className="text-[9px] uppercase tracking-[0.12em] text-muted">{label}</span>
    </motion.div>
  );
}

const LIVE_STAT_LABELS = [
  { key: "species", label: "Species Tracked" },
  { key: "genera", label: "Genera Covered" },
  { key: "soldCompsAnalysed", label: "Prices Tracked" },
] as const;

const GENUS_PILLS = [
  { label: "Monstera", href: "/plants/monstera" },
  { label: "Philodendron", href: "/plants/philodendron" },
  { label: "Anthurium", href: "/plants/anthurium" },
  { label: "Alocasia", href: "/plants/alocasia" },
  { label: "Begonia", href: "/plants/begonia" },
];

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPlant[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [liveStats, setLiveStats] = useState<Record<string, string>>({});
  const [allPlants, setAllPlants] = useState<SearchPlant[]>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) =>
        setLiveStats({
          species: d.species.toString(),
          genera: d.genera.toString(),
          soldCompsAnalysed: d.soldCompsAnalysed.toLocaleString(),
        })
      )
      .catch(() => {});
  }, []);

  function ensureSearchIndexLoaded() {
    if (indexLoaded || indexLoading) return;
    setIndexLoading(true);
    fetch("/api/plants")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllPlants(data);
          setIndexLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load search index in Hero:", err);
      })
      .finally(() => {
        setIndexLoading(false);
      });
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const q = value.toLowerCase();
    const results = allPlants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q) ||
        p.commonName.toLowerCase().includes(q) ||
        p.genus.toLowerCase().includes(q)
    );
    setSearchResults(results);
    setShowResults(results.length > 0);
  }

  function handleSelect(slug: string, genus: string) {
    setSearchQuery("");
    setShowResults(false);
    router.push(`/plants/${genus.toLowerCase()}/${slug}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
      handleSelect(searchResults[0].slug, searchResults[0].genus);
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* Warm-brass glow */}
      <div className="hero-glow pointer-events-none absolute inset-0" />

      {/* Faded AA emblem watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Image
          src="/images/aroidatlas-emblem-transparent-tight.png"
          alt=""
          width={480}
          height={480}
          className="opacity-[0.04] select-none"
          aria-hidden="true"
        />
      </div>

      <div className="section-container relative py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center justify-center gap-3"
          >
            <div className="h-px w-8 bg-accent/60" />
            <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              The Rare Plant Price Guide
            </p>
            <div className="h-px w-8 bg-accent/60" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
            className="font-heading text-4xl font-semibold leading-[1.12] text-heading md:text-5xl lg:text-[56px]"
          >
            Know what every rare aroid is actually worth.
          </motion.h1>

          {/* Supporting copy */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted"
          >
            Live eBay UK auction data and retailer prices for 170+ collector species — updated automatically every week.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="relative mx-auto mt-8 max-w-2xl"
            ref={searchRef}
          >
            <form onSubmit={handleSearchSubmit}>
              <svg
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                id="hero-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={ensureSearchIndexLoaded}
                placeholder="Search species, cultivars or common names..."
                className="w-full rounded-sm border border-border bg-surface py-4 pl-11 pr-4 text-sm text-heading placeholder-muted/50 outline-none transition-all duration-150 focus:border-primary/40 focus:shadow-glow"
              />
            </form>

            {/* Search Results Dropdown */}
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded border border-border bg-surface shadow-glass-hover"
              >
                {searchResults.slice(0, 6).map((plant) => (
                  <button
                    key={plant.slug}
                    onClick={() => handleSelect(plant.slug, plant.genus)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors duration-100 hover:bg-background-soft"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-[10px] font-semibold text-primary">
                      {plant.genus.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium italic text-heading">
                        {plant.scientificName}
                      </p>
                      <p className="truncate text-[10px] text-muted">{plant.commonName}</p>
                    </div>
                    <span className="badge-price shrink-0">
                      {plant.priceGuideTier} · {getStaticTierLabel(plant.priceGuideTier)}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Quick genus pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="text-[10px] uppercase tracking-wide text-muted/60">Browse:</span>
            {GENUS_PILLS.map((pill) => (
              <Link
                key={pill.href}
                href={pill.href}
                className="rounded-sm border border-border bg-surface px-3 py-1 text-xs font-medium text-muted transition-all duration-150 hover:border-border-strong hover:text-heading"
              >
                {pill.label}
              </Link>
            ))}
          </motion.div>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-8"
          >
            <Link href="/plants" className="btn-primary">
              Explore the atlas
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>

          {/* Live Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-10 flex justify-center"
          >
            <div className="inline-flex items-stretch divide-x divide-border rounded border border-border bg-surface">
              {LIVE_STAT_LABELS.map((s, i) => (
                <StatCard key={s.key} label={s.label} value={liveStats[s.key] ?? "—"} index={i} />
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
