"use client";

import { useState } from "react";

interface PriceCalculatorProps {
  aaPrice: number;
  varianceEnabled?: boolean;
}

type SizeKey = "tc_plantlet" | "rooted_cutting" | "whole_plant_7" | "whole_plant_12" | "whole_plant_17" | "whole_plant_21";
type VarKey = "light" | "medium" | "heavy" | "full-moon";

const SIZE_OPTIONS: { key: SizeKey; label: string; ratio: number }[] = [
  { key: "tc_plantlet",    label: "TC / Plantlet", ratio: 0.12 },
  { key: "rooted_cutting", label: "Rooted cutting", ratio: 0.32 },
  { key: "whole_plant_7",  label: "7cm pot",        ratio: 1.00 },
  { key: "whole_plant_12", label: "12cm pot",        ratio: 2.20 },
  { key: "whole_plant_17", label: "17cm pot",        ratio: 3.80 },
  { key: "whole_plant_21", label: "21cm+ / Mature",  ratio: 6.00 },
];

const VARIEGATION_OPTIONS: { key: VarKey; label: string; multiplier: number }[] = [
  { key: "light",      label: "Light",     multiplier: 1.3 },
  { key: "medium",     label: "Medium",    multiplier: 2.0 },
  { key: "heavy",      label: "Heavy",     multiplier: 3.5 },
  { key: "full-moon",  label: "Full Moon", multiplier: 6.0 },
];

export default function PriceCalculator({ aaPrice, varianceEnabled = false }: PriceCalculatorProps) {
  const [selectedSize, setSelectedSize] = useState<SizeKey>("whole_plant_7");
  const [selectedVar, setSelectedVar] = useState<VarKey | null>(null);

  const sizeRatio = SIZE_OPTIONS.find((s) => s.key === selectedSize)?.ratio ?? 1;
  const varMultiplier = varianceEnabled && selectedVar
    ? (VARIEGATION_OPTIONS.find((v) => v.key === selectedVar)?.multiplier ?? 1)
    : 1;

  const estimate = Math.round(aaPrice * sizeRatio * varMultiplier);
  const baseDesc = SIZE_OPTIONS.find((s) => s.key === selectedSize)?.label ?? "";

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-4 space-y-4 shadow-card-sm">
      <div>
        <p className="font-body text-xs font-semibold tracking-wider uppercase text-muted">
          Price Calculator
        </p>
        <p className="mt-0.5 text-[10px] text-muted/70">
          Estimate based on the AA Price — ratios are typical market averages.
        </p>
      </div>

      {/* Size selector */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold tracking-wider uppercase text-heading">Size / Form</p>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedSize(opt.key)}
              className={[
                "rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition-all duration-300 ease-in-out hover:-translate-y-0.5",
                selectedSize === opt.key
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border/40 bg-background-soft text-muted hover:border-accent/40 hover:text-heading",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Variegation selector — only if enabled */}
      {varianceEnabled && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider uppercase text-heading">Variegation</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedVar(null)}
              className={[
                "rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition-all duration-300 ease-in-out hover:-translate-y-0.5",
                selectedVar === null
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border/40 bg-background-soft text-muted hover:border-accent/40 hover:text-heading",
              ].join(" ")}
            >
              Standard
            </button>
            {VARIEGATION_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedVar(opt.key)}
                className={[
                  "rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition-all duration-300 ease-in-out hover:-translate-y-0.5",
                  selectedVar === opt.key
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border/40 bg-background-soft text-muted hover:border-accent/40 hover:text-heading",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estimated price output */}
      <div className="flex items-baseline justify-between border-t border-border/30 pt-3">
        <div>
          <p className="text-[9px] text-muted/60 uppercase tracking-wider">Estimated value</p>
          <p className="mt-0.5 font-heading text-2xl font-semibold text-accent">~£{estimate}</p>
          <p className="text-[9px] text-muted/60">
            AA Price £{aaPrice} × {sizeRatio.toFixed(2)} ({baseDesc})
            {varMultiplier > 1 && ` × ${varMultiplier}× variegation`}
          </p>
        </div>
        <span className="rounded-xl bg-amber-50 border border-amber-200/60 px-2 py-1 text-[9px] font-medium text-amber-700">
          Estimate only
        </span>
      </div>
    </div>
  );
}
