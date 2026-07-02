"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { getStaticTierLabel } from "@/lib/prices/priceRarityTier";

interface SearchPlant {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  genus: string;
  genusSlug: string;
  rarityStatus: string;
  priceGuideTier: string;
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPlant[]>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);

  const [allPlants, setAllPlants] = useState<SearchPlant[]>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexLoaded, setIndexLoaded] = useState(false);

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
        console.error("Failed to load search index:", err);
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

  function handleSelect(slug: string, genusSlug: string) {
    setSearchQuery("");
    setShowResults(false);
    router.push(`/plants/${genusSlug}/${slug}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setSearchQuery("");
      setShowResults(false);
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const navLinks = [
    { href: "/catalog", label: "Plants", active: pathname.startsWith("/catalog") || pathname.startsWith("/plants") },
    { href: "/price-index", label: "Price Index", active: pathname === "/price-index" },
    { href: "/compare", label: "Compare", active: pathname === "/compare" },
    { href: "/identify", label: "Identify", active: pathname === "/identify" },
    { href: "/learn", label: "Learn", active: pathname === "/learn" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/98 backdrop-blur-sm">
      <nav className="mx-auto max-w-[1300px] px-6">
        <div className="flex h-[82px] items-center gap-8">

          {/* ── Brand Block ─────────────────────────────────────────── */}
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            {/* Replace with final AroidAtlas circular logo asset. */}
            <div className="relative h-[56px] w-[56px] shrink-0 md:h-[62px] md:w-[62px]">
              <Image
                src="/images/aroidatlas-emblem-transparent-tight.png"
                alt="Aroid Atlas emblem"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="relative pb-1 font-heading text-[17px] font-bold tracking-[0.14em] text-heading transition-colors duration-150 md:text-[19px]">
                <span className="text-accent transition-colors duration-150 group-hover:text-accent-muted">A</span>ROID{" "}
                <span className="text-accent transition-colors duration-150 group-hover:text-accent-muted">A</span>TLAS
                <span className="absolute bottom-0 left-0 h-[1.5px] w-full bg-accent/20 origin-left transform scale-x-100 transition-all duration-300 group-hover:bg-accent group-hover:scale-x-105" />
              </span>
              <span className="mt-1.5 font-body text-[9px] tracking-[0.1em] text-accent/80 hidden sm:block">
                Rare Plant Directory &amp; Value Index
              </span>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── Desktop Navigation ──────────────────────────────────── */}
          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={link.active ? "nav-link-active" : "nav-link"}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Fine vertical divider */}
          <div className="hidden h-4 w-px bg-border md:block" />

          {/* ── Desktop Search ───────────────────────────────────────── */}
          <div className="relative hidden md:block w-52 focus-within:w-72 lg:w-60 lg:focus-within:w-80 transition-all duration-300" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <svg
                className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
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
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={ensureSearchIndexLoaded}
                placeholder="Search species..."
                className="w-full rounded-xl border border-border/40 bg-surface py-2 pl-9 pr-3 text-sm text-heading placeholder-muted/50 outline-none transition-all duration-300 focus:border-primary/30 focus:shadow-glow"
              />
            </form>

            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-1.5 w-[380px] lg:w-[420px] overflow-hidden rounded-xl border border-border/30 bg-surface shadow-glass-hover"
                >
                  {searchResults.slice(0, 6).map((plant) => (
                    <button
                      key={plant.slug}
                      onClick={() => handleSelect(plant.slug, plant.genusSlug)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-background-soft"
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
            </AnimatePresence>
          </div>

          {/* ── Mobile Hamburger ─────────────────────────────────────── */}
          <button
            className="icon-btn md:hidden"
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
        </div>
      </nav>

      {/* ── Mobile Menu ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border/30 bg-surface md:hidden"
          >
            <div className="px-6 py-5 space-y-1">
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="relative mb-5">
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
                  id="navbar-mobile-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={ensureSearchIndexLoaded}
                  placeholder="Search species, cultivars..."
                  className="w-full rounded-xl border border-border/40 bg-background py-2.5 pl-10 pr-4 text-sm text-heading placeholder-muted/50 outline-none transition-all duration-300 focus:border-primary/30 focus:shadow-glow"
                />
              </form>

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-sm px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    link.active
                      ? "bg-primary/8 text-heading"
                      : "text-muted hover:bg-background-soft hover:text-heading"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
