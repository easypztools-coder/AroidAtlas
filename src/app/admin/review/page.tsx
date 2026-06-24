"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface QueueItem {
  id: number;
  retailerSlug: string;
  productTitle: string;
  productUrl: string;
  proposedPlantSlug: string;
  genus: string;
  matchConfidence: number;
  proposedItemType: string;
  priceGbp: number;
  reason: string;
  createdAt: string;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const textColor = value >= 0.8 ? "text-green-400" : value >= 0.72 ? "text-yellow-400" : "text-orange-400";
  const barColor = value >= 0.8 ? "bg-green-400" : value >= 0.72 ? "bg-yellow-400" : "bg-orange-400";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-semibold ${textColor}`}>{pct}% match</span>
    </div>
  );
}

function ReviewQueue() {
  const searchParams = useSearchParams();
  const urlSecret = searchParams.get("secret") ?? "";

  const [secret, setSecret] = useState(urlSecret);
  const [secretInput, setSecretInput] = useState("");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dismissing, setDismissing] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<number, "accepting" | "rejecting">>({});
  const [editedSlugs, setEditedSlugs] = useState<Record<number, string>>({});
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
    action: "accept" | "reject";
  } | null>(null);

  const fetchItems = useCallback(async (s: string) => {
    if (!s) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/retail-prices/review?secret=${encodeURIComponent(s)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setItems((json as { items: QueueItem[] }).items ?? []);
      setDismissing(new Set());
      setEditedSlugs({});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (secret) fetchItems(secret);
  }, [secret, fetchItems]);

  function dismissItem(id: number) {
    setDismissing((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDismissing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 280);
  }

  async function postAction(
    id: number,
    action: "accept" | "reject",
    proposedPlantSlug: string
  ): Promise<boolean> {
    try {
      const res = await fetch(
        `/api/admin/retail-prices/review?secret=${encodeURIComponent(secret)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action, proposedPlantSlug }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async function handleAction(item: QueueItem, action: "accept" | "reject") {
    const effectiveSlug = editedSlugs[item.id] ?? item.proposedPlantSlug;
    setActionState((s) => ({ ...s, [item.id]: action === "accept" ? "accepting" : "rejecting" }));
    const ok = await postAction(item.id, action, effectiveSlug);
    setActionState((s) => {
      const next = { ...s };
      delete next[item.id];
      return next;
    });
    if (ok) {
      dismissItem(item.id);
    } else {
      alert(`Action failed — check console for details.`);
    }
  }

  async function handleBulkAction(groupItems: QueueItem[], action: "accept" | "reject") {
    if (bulkProgress) return;
    const pending = [...groupItems];
    setBulkProgress({ done: 0, total: pending.length, action });
    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      const effectiveSlug = editedSlugs[item.id] ?? item.proposedPlantSlug;
      await postAction(item.id, action, effectiveSlug);
      dismissItem(item.id);
      setBulkProgress({ done: i + 1, total: pending.length, action });
    }
    setBulkProgress(null);
  }

  const visibleItems = items.filter((i) => !dismissing.has(i.id));
  const grouped = visibleItems.reduce<Record<string, QueueItem[]>>((acc, item) => {
    (acc[item.retailerSlug] ??= []).push(item);
    return acc;
  }, {});

  // ── Secret entry form ──────────────────────────────────────────────────────
  if (!secret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card p-8 w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-xl font-bold text-heading font-heading">Admin Access</h1>
            <p className="text-sm text-muted mt-1">
              Enter your admin secret to access the review queue.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (secretInput.trim()) setSecret(secretInput.trim());
            }}
            className="space-y-3"
          >
            <input
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Admin secret..."
              autoFocus
              className="w-full rounded-lg border border-primary/20 bg-card px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-primary/50"
            />
            <button type="submit" className="btn-primary w-full text-sm py-2.5">
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main review UI ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-heading font-heading">
              Retail Price Review Queue
            </h1>
            <p className="text-sm text-muted mt-1">
              Products matched at 65–84% confidence — review before they appear on plant pages.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted">{items.length} pending</span>
            <button
              onClick={() => fetchItems(secret)}
              className="text-xs text-primary hover:underline"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Bulk progress banner */}
        {bulkProgress && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-6 flex items-center gap-4">
            <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted shrink-0">
              {bulkProgress.action === "accept" ? "Accepting" : "Rejecting"}{" "}
              {bulkProgress.done} / {bulkProgress.total}
            </span>
          </div>
        )}

        {loading && (
          <p className="text-sm text-muted animate-pulse">Loading queue...</p>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border border-primary/10 bg-card/30 px-6 py-16 text-center">
            <p className="text-sm text-muted">Queue is empty — nothing to review.</p>
          </div>
        )}

        {/* Grouped item sections */}
        {Object.entries(grouped).map(([retailer, groupItems]) => (
          <div key={retailer} className="mb-8">

            {/* Group header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-heading capitalize">
                  {retailer.replace(/-/g, " ")}
                </span>
                <span className="text-xs text-muted">({groupItems.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction(groupItems, "reject")}
                  disabled={!!bulkProgress}
                  className="text-xs font-semibold px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                >
                  Reject All
                </button>
                <button
                  onClick={() => handleBulkAction(groupItems, "accept")}
                  disabled={!!bulkProgress}
                  className="text-xs font-semibold px-3 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-40"
                >
                  Accept All
                </button>
              </div>
            </div>

            {/* Item cards */}
            <div className="space-y-2">
              {[...groupItems, ...items.filter((i) => dismissing.has(i.id) && i.retailerSlug === retailer)].map(
                (item) => {
                  const isDismissing = dismissing.has(item.id);
                  const busy = actionState[item.id];
                  const effectiveSlug = editedSlugs[item.id] ?? item.proposedPlantSlug;
                  const plantUrl =
                    item.genus && item.genus !== "unknown"
                      ? `/plants/${item.genus}/${item.proposedPlantSlug}`
                      : null;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border border-primary/10 bg-card/40 p-4 transition-all duration-[280ms] ${
                        isDismissing ? "opacity-0 -translate-x-3" : "opacity-100 translate-x-0"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

                        {/* Left: product info */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <ConfidenceBar value={item.matchConfidence} />
                            <span className="text-[10px] text-muted capitalize">
                              {item.proposedItemType.replace(/_/g, " ")}
                            </span>
                          </div>

                          <a
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-heading hover:text-primary transition-colors line-clamp-1 block"
                          >
                            {item.productTitle}
                          </a>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-muted">Plant:</span>
                            <input
                              type="text"
                              value={effectiveSlug}
                              onChange={(e) =>
                                setEditedSlugs((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="text-[11px] font-medium text-primary bg-transparent border-b border-primary/20 focus:border-primary/60 focus:outline-none w-44 min-w-0"
                            />
                            {plantUrl && (
                              <a
                                href={plantUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-muted hover:text-primary transition-colors"
                                title="Open plant page"
                              >
                                ↗
                              </a>
                            )}
                            <span className="text-[10px] text-muted/40">·</span>
                            <span className="text-[10px] text-muted italic truncate max-w-[240px]">
                              {item.reason}
                            </span>
                          </div>
                        </div>

                        {/* Right: price + actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start sm:mt-0.5">
                          <span className="text-base font-bold text-green-400">
                            £{item.priceGbp.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleAction(item, "reject")}
                            disabled={!!busy || !!bulkProgress}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          >
                            {busy === "rejecting" ? "…" : "Reject"}
                          </button>
                          <button
                            onClick={() => handleAction(item, "accept")}
                            disabled={!!busy || !!bulkProgress}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-background hover:bg-primary/90 transition-colors disabled:opacity-40"
                          >
                            {busy === "accepting" ? "…" : "Accept"}
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                }
              )}
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}

export default function ReviewQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-sm text-muted animate-pulse">Loading...</p>
        </div>
      }
    >
      <ReviewQueue />
    </Suspense>
  );
}
