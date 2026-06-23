"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface QueueItem {
  id: number;
  retailerSlug: string;
  productTitle: string;
  productUrl: string;
  proposedPlantSlug: string;
  matchConfidence: number;
  proposedItemType: string;
  priceGbp: number;
  reason: string;
  createdAt: string;
}

export default function ReviewQueuePage() {
  const searchParams = useSearchParams();
  const secret = searchParams.get("secret") ?? "";

  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<number, "accepting" | "rejecting" | "done">>({});

  const fetchItems = useCallback(async () => {
    if (!secret) { setError("Missing ?secret= in URL"); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/retail-prices/review?secret=${encodeURIComponent(secret)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setItems(json.items ?? []);
      setTotal(json.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleAction(id: number, action: "accept" | "reject") {
    setActionState((s) => ({ ...s, [id]: action === "accept" ? "accepting" : "rejecting" }));
    try {
      const res = await fetch(`/api/admin/retail-prices/review?secret=${encodeURIComponent(secret)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setActionState((s) => ({ ...s, [id]: "done" }));
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      alert(`Action failed: ${e instanceof Error ? e.message : String(e)}`);
      setActionState((s) => { const n = { ...s }; delete n[id]; return n; });
    }
  }

  const confidenceColor = (c: number) =>
    c >= 0.80 ? "text-green-400" : c >= 0.72 ? "text-yellow-400" : "text-orange-400";

  return (
    <div className="min-h-screen bg-background px-4 py-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-heading font-heading">Retail Price Review Queue</h1>
        <p className="text-sm text-muted mt-1">
          Products matched at 65–84% confidence — too uncertain to auto-accept. Review and accept to add them to plant pages.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted animate-pulse">Loading queue...</p>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted">{total} item{total !== 1 ? "s" : ""} pending</span>
            <button
              onClick={fetchItems}
              className="text-xs text-primary hover:underline"
            >
              Refresh
            </button>
          </div>

          {items.length === 0 && (
            <div className="rounded-xl border border-primary/10 bg-card/30 px-6 py-12 text-center">
              <p className="text-sm text-muted">Queue is empty — nothing to review.</p>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item) => {
              const busy = actionState[item.id];
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border border-primary/10 bg-card/40 p-4 transition-opacity ${busy === "done" ? "opacity-0" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: product info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                          {item.retailerSlug}
                        </span>
                        <span className={`text-[10px] font-semibold ${confidenceColor(item.matchConfidence)}`}>
                          {(item.matchConfidence * 100).toFixed(0)}% match
                        </span>
                        <span className="text-[10px] text-muted capitalize">
                          {item.proposedItemType.replace(/_/g, " ")}
                        </span>
                      </div>

                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-heading hover:text-primary transition-colors line-clamp-2 block"
                      >
                        {item.productTitle}
                      </a>

                      <div className="flex items-center gap-3 text-[10px] text-muted">
                        <span>
                          Proposed:{" "}
                          <a
                            href={`/plants/${item.proposedPlantSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {item.proposedPlantSlug}
                          </a>
                        </span>
                        <span className="text-muted/50">·</span>
                        <span className="italic">{item.reason}</span>
                      </div>
                    </div>

                    {/* Right: price + actions */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-start sm:mt-1">
                      <span className="text-lg font-bold text-green-400">
                        £{item.priceGbp.toFixed(2)}
                      </span>

                      <button
                        onClick={() => handleAction(item.id, "reject")}
                        disabled={!!busy}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        {busy === "rejecting" ? "…" : "Reject"}
                      </button>

                      <button
                        onClick={() => handleAction(item.id, "accept")}
                        disabled={!!busy}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-background hover:bg-primary/90 transition-colors disabled:opacity-40"
                      >
                        {busy === "accepting" ? "…" : "Accept"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
