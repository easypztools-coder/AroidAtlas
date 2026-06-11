"use client";

import { motion } from "framer-motion";

export default function CompareSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card-glow overflow-hidden rounded-3xl p-8 md:p-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* VS Section */}
            <div className="space-y-6">
              <h2 className="section-heading">Compare Species</h2>
              <p className="section-subheading">
                Side-by-side analysis of morphology, care requirements, and market
                data. Make informed decisions for your collection.
              </p>

              <div className="flex items-center gap-4 py-4">
                {/* Plant 1 */}
                <div className="flex-1 glass-card p-4 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                    <svg
                      className="h-8 w-8 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-heading">
                    Philodendron billietiae
                  </p>
                  <span className="badge-primary mt-2 inline-block">Medium</span>
                </div>

                {/* VS Badge */}
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
                    <span className="text-sm font-bold text-primary">VS</span>
                  </div>
                </div>

                {/* Plant 2 */}
                <div className="flex-1 glass-card p-4 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-price/10">
                    <svg
                      className="h-8 w-8 text-price"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-heading">
                    Philodendron atabapoense
                  </p>
                  <span className="badge-price mt-2 inline-block">£</span>
                </div>
              </div>

              <a
                href="/compare"
                className="btn-primary inline-flex w-full sm:w-auto"
              >
                Start Comparing
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>

            {/* Right: Visual indicator */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative aspect-square w-full max-w-sm">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-price/10 blur-2xl" />
                <div className="relative flex h-full w-full items-center justify-center">
                  <svg
                    className="h-48 w-48 text-primary/20"
                    viewBox="0 0 100 100"
                    fill="none"
                  >
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                    <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                    <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1" opacity="0.15" />
                    <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                    <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}