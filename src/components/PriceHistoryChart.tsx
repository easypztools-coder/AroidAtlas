"use client";

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { PriceHistoryPoint } from "@/lib/prices/types";

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
}

/**
 * PriceHistoryChart — Dark luxury AroidAtlas aesthetic.
 *
 * Shows:
 * - Median price as the main line
 * - Optional p25-p75 range as a shaded band
 * - Sample size / confidence displayed beneath
 * - Label: "eBay UK sold prices"
 * - Note: "Based on filtered completed listings. Excludes unrelated species, multipacks and statistical outliers."
 */
export default function PriceHistoryChart({
  data,
}: PriceHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-card p-6 text-center">
        <p className="text-sm text-muted">No price data available yet.</p>
        <p className="mt-2 text-xs text-muted/60">
          Run the admin price update endpoint to fetch the first snapshot.
        </p>
      </div>
    );
  }

  const latest = data[data.length - 1];

  return (
    <div className="space-y-4">
      {/* ─── Chart ──────────────────────────────────────────────────────── */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2A2F2D"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => {
                const date = new Date(d);
                return date.toLocaleDateString("en-GB", {
                  month: "short",
                  day: "numeric",
                });
              }}
              stroke="#8B9A92"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="#8B9A92"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `£${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1F1D",
                border: "1px solid #2A2F2D",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#FFFFFF",
              }}
              formatter={(value: unknown) => {
                const num = typeof value === "number" ? value : parseFloat(String(value ?? "0"));
                return [`£${(num || 0).toFixed(2)}`, "Median Price"];
              }}
            />

            {/* p25-p75 range band */}
            <Area
              type="monotone"
              dataKey="p75"
              stroke="#C3D9A1"
              strokeWidth={0}
              fill="#C3D9A1"
              fillOpacity={0.08}
            />
            <Area
              type="monotone"
              dataKey="p25"
              stroke="#C3D9A1"
              strokeWidth={0}
              fill="#1A1F1D"
              fillOpacity={0}
            />

            {/* Median line */}
            <Line
              type="monotone"
              dataKey="median"
              stroke="#C3D9A1"
              strokeWidth={2}
              dot={{ fill: "#C3D9A1", strokeWidth: 0, r: 3 }}
              activeDot={{ fill: "#C3D9A1", strokeWidth: 0, r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Stats Footer ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-card/80 pt-3 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-muted">eBay UK sold prices</span>
          <span className="text-muted/60">
            Based on filtered completed listings. Excludes unrelated species,
            multipacks and statistical outliers.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-[10px] font-medium">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                latest.confidenceScore === "A"
                  ? "bg-green-400"
                  : latest.confidenceScore === "B"
                  ? "bg-yellow-400"
                  : latest.confidenceScore === "C"
                  ? "bg-orange-400"
                  : "bg-red-400"
              }`}
            />
            {latest.confidenceScore}
          </span>
          <span className="text-muted">
            n={latest.sampleSize}
          </span>
        </div>
      </div>
    </div>
  );
}