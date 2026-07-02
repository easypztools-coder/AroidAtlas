"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import SimplifiedPlateCard from "@/components/SimplifiedPlateCard";

const PlantPhotoCarousel = dynamic(() => import("@/components/PlantPhotoCarousel"), {
  loading: () => <div className="h-full w-full animate-pulse bg-background-soft" />,
  ssr: false,
});

interface PlantPlateImageProps {
  src: string;
  alt: string;
  scientificName: string;
  botanicalType: string;
  contentTier: "plate" | "sketch";
  slug: string;
  size?: "card" | "feature";
  className?: string;
  sizes: string;
  priority?: boolean;
}

// Renders the real botanical plate image for "plate" tier plants (or the
// templated SimplifiedPlateCard if a "plate" tier image genuinely fails to load).
//
// Hard rule for "sketch" tier (no museum plate painted yet): at feature size
// (the detail-page hero, which has room for a gallery) always prefer real
// iNaturalist photos of the species over the templated card — a real photo
// beats a uniform placeholder. The templated card is the last resort, used
// only when iNaturalist has no research-grade photos for that name (common
// for cultivar-only names). Card-size grid tiles are too small for carousel
// controls, so they always show the templated card for sketch-tier plants.
export default function PlantPlateImage({
  src,
  alt,
  scientificName,
  botanicalType,
  contentTier,
  slug,
  size = "card",
  className,
  sizes,
  priority,
}: PlantPlateImageProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (contentTier === "sketch") {
    if (size === "feature") {
      return (
        <PlantPhotoCarousel
          slug={slug}
          scientificName={scientificName}
          variant="feature"
          fallback={<SimplifiedPlateCard scientificName={scientificName} botanicalType={botanicalType} size={size} />}
        />
      );
    }
    return <SimplifiedPlateCard scientificName={scientificName} botanicalType={botanicalType} size={size} />;
  }

  if (imageFailed) {
    return <SimplifiedPlateCard scientificName={scientificName} botanicalType={botanicalType} size={size} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setImageFailed(true)}
    />
  );
}
