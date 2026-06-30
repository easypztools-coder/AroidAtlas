"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const BULLETS = [
  {
    label: "Verified Auctions",
    detail:
      "Only completed eBay UK sales are used — buy-it-now listings and unsold items are excluded entirely.",
  },
  {
    label: "Trimmed Mean",
    detail:
      "The top and bottom 20% of prices are removed to filter outliers before the average is calculated.",
  },
  {
    label: "Retail Cross-Check",
    detail:
      "Where auction data is thin, the AA Price falls back to the trimmed mean of current UK retailer stock.",
  },
];

export default function PriceMethodology() {
  return (
    <section className="section-spacing bg-surface">
      <div className="section-container">
        {/* Brass rule above */}
        <div className="mb-12 h-px w-full bg-border/40" />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Left — editorial callout */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-5"
          >
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-8 bg-accent/60" />
                <p className="font-body text-xs font-semibold tracking-wider uppercase text-accent">
                  The AA Price
                </p>
              </div>
              <h2 className="font-heading text-3xl font-semibold italic leading-tight text-heading md:text-[34px]">
                A fair price, derived from real transactions.
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-muted">
              We analyse eBay UK completed auction data for each species — applying a trimmed mean to remove
              extreme outliers — then cross-reference live UK retailer prices to produce the AA Price: a
              grounded, honest estimate of what you should pay.
            </p>

            <Link
              href="/plants/anthurium/crystallinum"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent underline underline-offset-4 transition-colors duration-150 hover:text-accent/70"
            >
              See a live price profile
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>

          {/* Right — methodology bullets */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="rounded-xl border border-border/40 bg-background-soft p-6 space-y-0 shadow-card-sm"
          >
            <div className="-mx-6 -mt-6 mb-6 h-px bg-accent/10" />
            <p className="mb-5 font-body text-xs font-semibold tracking-wider uppercase text-muted">
              Methodology
            </p>
            <div className="space-y-5">
              {BULLETS.map((bullet, i) => (
                <motion.div
                  key={bullet.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  className="flex gap-4"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                  <div>
                    <p className="text-sm font-semibold text-heading">{bullet.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{bullet.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
