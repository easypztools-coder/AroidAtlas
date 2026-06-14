"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { featuredPlants } from "@/lib/mock-data";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";

function StatCard({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
      className="glass-card flex flex-col items-center gap-1 px-4 py-3 text-center"
    >
      <span className="text-lg font-bold text-heading tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
    </motion.div>
  );
}

const LIVE_STAT_LABELS = [
  { key: "species",           label: "Species Tracked" },
  { key: "genera",            label: "Genera Covered" },
  { key: "soldCompsAnalysed", label: "Sold Comps Analysed" },
  { key: "priceChecks",       label: "Price Checks Run" },
] as const;

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof featuredPlants>([]);
  const [showResults, setShowResults] = useState(false);
  const [liveStats, setLiveStats] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) =>
        setLiveStats({
          species:           d.species.toString(),
          genera:            d.genera.toString(),
          soldCompsAnalysed: d.soldCompsAnalysed.toLocaleString(),
          priceChecks:       d.priceChecks.toString(),
        })
      )
      .catch(() => {});
  }, []);

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
    const results = featuredPlants.filter(
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
    const genusPath = genus.toLowerCase();
    router.push(`/plants/${genusPath}/${slug}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
      handleSelect(searchResults[0].slug, searchResults[0].genus);
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* Background Glow */}
      <div className="hero-glow pointer-events-none absolute inset-0" />

      <div className="section-container relative py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-heading leading-tight">
                The visual encyclopedia of{" "}
                <span className="text-primary">rare tropical plants</span>
              </h1>
              <p className="text-base md:text-lg text-muted-light max-w-xl leading-relaxed">
                Discover, explore and compare the world&rsquo;s most extraordinary aroids.
                A curated atlas for the discerning collector.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative max-w-lg"
              ref={searchRef}
            >
              <form onSubmit={handleSearchSubmit}>
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
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
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search species, cultivars, or common names..."
                  className="w-full rounded-2xl border border-primary/15 bg-card/70 py-4 pl-12 pr-4 text-sm text-heading placeholder-muted/50 outline-none transition-all duration-300 focus:border-primary/30 focus:bg-card focus:shadow-glow backdrop-blur-md"
                />
              </form>
              {/* Search Results Dropdown */}
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-primary/10 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden z-50"
                >
                  {searchResults.slice(0, 6).map((plant) => (
                    <button
                      key={plant.slug}
                      onClick={() => handleSelect(plant.slug, plant.genus)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-primary/10"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs text-primary font-medium">
                        {plant.genus.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-heading italic truncate">{plant.scientificName}</p>
                        <p className="text-xs text-muted truncate">{plant.commonName}</p>
                      </div>
                      <span className="badge-price shrink-0 text-[10px]">{plant.priceGuideTier} · {getStaticTierLabel(plant.priceGuideTier)}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              {LIVE_STAT_LABELS.map((s, i) => (
                <StatCard key={s.key} label={s.label} value={liveStats[s.key] ?? "—"} index={i} />
              ))}
            </motion.div>
          </div>

          {/* Right: Hero Plant Render Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto">
              {/* Glow behind the plant */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />

              {/* Styled Container for hero plant image */}
              <Link
                href="/plants/philodendron/spiritus-sancti"
                className="glass-card-glow relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl"
              >
                <Image
                  src="/api/plant-image?genus=philodendron&slug=spiritus-sancti"
                  alt="Philodendron spiritus-sancti — Hero Specimen"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />

                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-forest-dark/60" />

                {/* Label */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-xs text-muted/60 font-medium tracking-wider uppercase">
                    Featured Specimen
                  </p>
                  <p className="text-sm text-heading/70 font-heading italic">
                    Philodendron spiritus-sancti
                  </p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}