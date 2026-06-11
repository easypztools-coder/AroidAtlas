"use client";

import { motion } from "framer-motion";

const stages = [
  { label: "Seedling", description: "First true leaves emerge", icon: "🌱" },
  { label: "Juvenile", description: "Rapid vegetative growth", icon: "🌿" },
  { label: "Intermediate", description: "Transitional leaf morphology", icon: "🌾" },
  { label: "Mature", description: "Full leaf size and fenestrations", icon: "🌴" },
  { label: "Habitat Specimen", description: "Wild-type expression", icon: "🌳" },
];

export default function MaturityJourney() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-deep/50 via-transparent to-forest-deep/50" />

      <div className="section-container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="section-heading">Maturity Journey</h2>
          <p className="section-subheading mt-3 mx-auto">
            Witness the remarkable transformation from seedling to habitat specimen.
            A signature feature of AroidAtlas.
          </p>
        </motion.div>

        {/* Connected Progression */}
        <div className="relative">
          {/* Connecting line (hidden on mobile) */}
          <div className="absolute top-12 left-[calc(10%+12px)] right-[calc(10%+12px)] h-px bg-gradient-to-r from-primary/5 via-primary/20 to-primary/5 hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4">
            {stages.map((stage, idx) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Stage Node */}
                <div
                  className={`relative z-10 flex h-12 w-12 md:h-10 md:w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    idx === stages.length - 1
                      ? "border-primary bg-primary/20 shadow-lg shadow-primary/20"
                      : "border-primary/30 bg-card/80"
                  }`}
                >
                  <span className="text-lg md:text-base">{stage.icon}</span>
                </div>

                {/* Card */}
                <div className="glass-card mt-4 w-full p-4 text-center">
                  <h3 className="text-sm font-semibold text-heading">
                    {stage.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                {/* Stage indicator dots */}
                {idx < stages.length - 1 && (
                  <div className="flex gap-1 mt-3 md:hidden">
                    <div className="h-1 w-1 rounded-full bg-primary/40" />
                    <div className="h-1 w-1 rounded-full bg-primary/20" />
                    <div className="h-1 w-1 rounded-full bg-primary/10" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}