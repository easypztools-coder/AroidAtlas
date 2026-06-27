"use client";

import { useEffect, useState, useCallback } from "react";

interface Photo {
  url: string;
  attribution: string;
  observationUrl: string;
  location: string | null;
}

interface Props {
  slug: string;
  scientificName: string;
}

export default function PlantPhotoCarousel({ slug, scientificName }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [taxonName, setTaxonName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch(`/api/plants/${slug}/photos`)
      .then((r) => r.json())
      .then((json) => {
        setPhotos(json.photos ?? []);
        setTaxonName(json.taxonName ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-heading">In the Wild</h2>
          <span className="text-[10px] text-muted">Loading observations…</span>
        </div>
        <div className="aspect-[4/3] animate-pulse rounded border border-border bg-background-soft" />
      </div>
    );
  }

  if (photos.length === 0) return null;

  const photo = photos[current];
  const isErrored = imgError[current];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-heading">In the Wild</h2>
          <p className="text-[10px] text-muted">
            Research-grade observations of{" "}
            <span className="italic">{taxonName || scientificName}</span> via iNaturalist
          </p>
        </div>
        <span className="text-xs text-muted">
          {current + 1} / {photos.length}
        </span>
      </div>

      {/* Main image */}
      <div className="relative overflow-hidden rounded border border-border bg-background-soft">
        <div className="relative aspect-[4/3]">
          {!isErrored ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.url}
              alt={`${scientificName} — iNaturalist research-grade observation`}
              className="h-full w-full object-cover"
              onError={() => setImgError((prev) => ({ ...prev, [current]: true }))}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs italic text-muted">
              Image unavailable
            </div>
          )}

          {/* Prev / Next overlays */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-sm border border-border/60 bg-surface/80 text-muted backdrop-blur-sm transition-all duration-150 hover:bg-surface hover:text-heading"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={next}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-sm border border-border/60 bg-surface/80 text-muted backdrop-blur-sm transition-all duration-150 hover:bg-surface hover:text-heading"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Caption bar */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-3 py-2">
          <div className="min-w-0 flex-1">
            {photo.location && (
              <p className="truncate text-[10px] text-muted">
                <span className="mr-1 font-medium text-heading/60">Location</span>
                {photo.location}
              </p>
            )}
            {photo.attribution && (
              <p className="truncate text-[9px] text-muted/60">{photo.attribution}</p>
            )}
          </div>
          <a
            href={photo.observationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[10px] font-semibold text-primary/70 transition-colors duration-150 hover:text-primary"
          >
            View on iNaturalist →
          </a>
        </div>
      </div>

      {/* Dot / thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Photo ${i + 1}`}
              className={`h-10 w-10 shrink-0 overflow-hidden rounded border transition-all duration-150 ${
                i === current
                  ? "border-primary opacity-100 ring-1 ring-primary/30"
                  : "border-border opacity-50 hover:opacity-80"
              }`}
            >
              {!imgError[i] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.url.replace("/medium", "/square")}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setImgError((prev) => ({ ...prev, [i]: true }))}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
