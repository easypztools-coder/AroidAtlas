"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-heading font-bold text-primary tracking-tight">
            Ariod Atlas
          </span>
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
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
              placeholder="Search species, cultivars, or common names..."
              className="w-full rounded-xl border border-primary/10 bg-card/60 py-2.5 pl-10 pr-4 text-sm text-heading placeholder-muted/60 outline-none transition-all duration-300 focus:border-primary/30 focus:bg-card focus:shadow-glow"
            />
          </div>
        </div>

        {/* Nav Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-6">
          <Link href="/" className="nav-link-active">
            Explore
          </Link>
          <Link href="/compare" className="nav-link">
            Compare
          </Link>
          <Link href="/identify" className="nav-link">
            Identify
          </Link>
          <Link href="/learn" className="nav-link">
            Learn
          </Link>
        </div>

        {/* Icon Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-1">
          <button className="icon-btn" aria-label="Bookmarks">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </button>
          <button className="icon-btn" aria-label="Notifications">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </button>
          <button className="icon-btn" aria-label="Profile">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </button>
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
              <div className="relative mb-4">
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
                  placeholder="Search species, cultivars..."
                  className="w-full rounded-xl border border-primary/10 bg-background/60 py-2.5 pl-10 pr-4 text-sm text-heading placeholder-muted/60 outline-none transition-all duration-300 focus:border-primary/30 focus:bg-background"
                />
              </div>
              <Link
                href="/"
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