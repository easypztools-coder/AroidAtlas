"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { featuredPlants } from "@/lib/mock-data";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof featuredPlants>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);

  // All plants data for search
  const allPlants = featuredPlants;

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
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/logo.png"
            alt="Ariod Atlas"
            width={150}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
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
              className="w-full rounded-xl border border-primary/10 bg-card/60 py-2.5 pl-10 pr-4 text-sm text-heading placeholder-muted/60 outline-none transition-all duration-300 focus:border-primary/30 focus:bg-card focus:shadow-glow"
            />
          </form>
          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-primary/10 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden"
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
          </AnimatePresence>
        </div>

        {/* Nav Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-6">
          <Link href="/plants" className={pathname.startsWith("/plants") ? "nav-link-active" : "nav-link"}>
            Explore
          </Link>
          <Link href="/compare" className={pathname === "/compare" ? "nav-link-active" : "nav-link"}>
            Compare
          </Link>
          <Link href="/identify" className={pathname === "/identify" ? "nav-link-active" : "nav-link"}>
            Identify
          </Link>
          <Link href="/learn" className={pathname === "/learn" ? "nav-link-active" : "nav-link"}>
            Learn
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden icon-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-primary/10 bg-card/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-6 py-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="relative mb-4">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
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
                  placeholder="Search species, cultivars..."
                  className="w-full rounded-xl border border-primary/10 bg-background/60 py-2.5 pl-10 pr-4 text-sm text-heading placeholder-muted/60 outline-none transition-all duration-300 focus:border-primary/30 focus:bg-background"
                />
              </form>
              <Link
                href="/plants"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-heading transition hover:bg-primary/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore
              </Link>
              <Link
                href="/compare"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-primary/10 hover:text-heading"
                onClick={() => setMobileMenuOpen(false)}
              >
                Compare
              </Link>
              <Link
                href="/identify"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-primary/10 hover:text-heading"
                onClick={() => setMobileMenuOpen(false)}
              >
                Identify
              </Link>
              <Link
                href="/learn"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-primary/10 hover:text-heading"
                onClick={() => setMobileMenuOpen(false)}
              >
                Learn
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}