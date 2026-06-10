"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PricePoint {
  date: string;
  medianPriceGBP: number;
  dataPointsAnalyzed: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

export default function PriceChart({
  data,
  currentPrice,
}: {
  data: PricePoint[];
  currentPrice: number;
}) {
  return (
    <>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2F2D" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#8B9A92"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="#8B9A92"
              fontSize={10}
              tickLine={false}
              domain={["dataMin - 50", "dataMax + 50"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1F1D",
                border: "1px solid #2A2F2D",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#FFFFFF",
              }}
              labelFormatter={formatDate}
              formatter={(value) => {
                const num = typeof value === "number" ? value : 0;
                return [`£${num.toFixed(2)}`, "Median Price"];
              }}
            />
            <Line
              type="monotone"
              dataKey="medianPriceGBP"
              stroke="#C3D9A1"
              strokeWidth={2}
              dot={{ fill: "#C3D9A1", strokeWidth: 0, r: 3 }}
              activeDot={{ fill: "#C3D9A1", strokeWidth: 0, r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-card/80 pt-3 text-xs">
        <span className="text-muted">Current</span>
        <span className="font-semibold text-heading">
          £{currentPrice.toFixed(2)}
        </span>
      </div>
    </>
  );
}