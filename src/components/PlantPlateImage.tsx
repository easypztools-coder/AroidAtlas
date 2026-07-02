"use client";

import { useState } from "react";
import Image from "next/image";
import SimplifiedPlateCard from "@/components/SimplifiedPlateCard";

interface PlantPlateImageProps {
  src: string;
  alt: string;
  scientificName: string;
  botanicalType: string;
  contentTier: "plate" | "sketch";
  size?: "card" | "feature";
  className?: string;
  sizes: string;
  priority?: boolean;
}

// Renders the real botanical plate image for "plate" tier plants, or the
// templated SimplifiedPlateCard for "sketch" tier plants (or if a "plate"
// tier plant's image genuinely fails to load — same fallback either way).
export default function PlantPlateImage({
  src,
  alt,
  scientificName,
  botanicalType,
  contentTier,
  size = "card",
  className,
  sizes,
  priority,
}: PlantPlateImageProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (contentTier === "sketch" || imageFailed) {
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
