"use client";

import { motion } from "framer-motion";

export default function IdentifyPlant() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card-glow overflow-hidden rounded-3xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Upload Illustration */}
            <div className="relative flex items-center justify-center bg-gradient-to-br from-forest-deep to-card p-12 md:p-16">
              <div className="flex flex-col items-center text-center">
                {/* Upload icon SVG */}
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-primary/5">
                  <svg
                    className="h-10 w-10 text-primary/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <p className="text-xs text-muted/60 font-medium uppercase tracking-wider">
                  Upload a photo
                </p>
              </div>

              {/* Decorative leaf patterns */}
              <svg
                className="absolute bottom-0 right-0 h-32 w-32 text-primary/5"
                viewBox="0 0 200 200"
                fill="none"
              >
                <path
                  d="M180 180C180 180 130 140 130 100C130 60 160 30 180 20C200 30 200 60 200 100C200 140 180 180 180 180Z"
                  fill="currentColor"
                  opacity="0.3"
                />
              </svg>
            </div>

            {/* Right: Content */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h2 className="section-heading">Identify Plant</h2>
              <p className="section-subheading mt-3">
                Upload a photo and let AroidAtlas help identify your specimen.
                Our visual recognition technology cross-references thousands of
                species for accurate results.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/identify" className="btn-primary">
                  Identify Now
                </a>
                <a href="/learn" className="btn-secondary">
                  Learn More
                </a>
              </div>

              {/* Feature list */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <svg className="h-3.5 w-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Instant recognition
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <svg className="h-3.5 w-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Care recommendations
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <svg className="h-3.5 w-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Market value data
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <svg className="h-3.5 w-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Collection tracking
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}