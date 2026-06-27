"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    icon: (
      <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    heading: "Search the Atlas",
    body: "Find any species by scientific name, common name, or cultivar. Our index covers 170+ rare aroids across 6 genera.",
  },
  {
    number: "02",
    icon: (
      <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    heading: "See Real Market Data",
    body: "Each profile shows verified eBay UK auction history, current retail listings, and a trimmed-mean fair price — all in one place.",
  },
  {
    number: "03",
    icon: (
      <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    heading: "Buy With Confidence",
    body: "The AA Price tells you what a fair transaction looks like — so you never overpay or miss a deal on a plant you love.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-spacing bg-background-soft">
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-accent/60" />
            <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              How It Works
            </p>
            <div className="h-px w-8 bg-accent/60" />
          </div>
          <h2 className="section-heading">Price intelligence, made simple</h2>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              className="relative rounded border border-border bg-surface p-6"
            >
              {/* Top accent rule */}
              <div className="absolute left-0 right-0 top-0 h-px bg-accent/20" />

              {/* Step number + icon row */}
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent/10">
                  <span className="font-body text-[10px] font-bold text-accent">{step.number}</span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-background-soft">
                  {step.icon}
                </div>
              </div>

              <h3 className="font-heading text-lg font-semibold text-heading">{step.heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
