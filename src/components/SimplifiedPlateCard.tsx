import { getBotanicalTypeDetails } from "@/components/GenusPlantList";

export function LeafIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2l-.26-.05C11.89 4.45 10 4 8 4c-4 0-7 3-7 3l3 4c0-1 .5-3 4-4l2.15-.43A22.37 22.37 0 0 1 17 8Z" />
    </svg>
  );
}

interface SimplifiedPlateCardProps {
  scientificName: string;
  botanicalType: string;
  size?: "card" | "feature";
}

// Templated "specimen card" rendered in place of a botanical plate PNG for
// name-only, AI-inferred plants that don't have a hand-painted plate yet.
// Deliberately uniform across every plant of a given botanicalType — the lack
// of per-plant variation is what signals "provisional" vs. "museum plate".
export default function SimplifiedPlateCard({ scientificName, botanicalType, size = "card" }: SimplifiedPlateCardProps) {
  const details = getBotanicalTypeDetails(botanicalType);
  const iconColorClass = details.badgeClass.match(/text-[\w-]+/)?.[0] ?? "text-accent";
  const isFeature = size === "feature";

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background-soft px-6">
      {/* Brass corner registration marks */}
      <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-accent/40" />
      <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-accent/40" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-accent/40" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-accent/40" />

      <LeafIcon className={`${isFeature ? "h-28 w-28" : "h-16 w-16"} ${iconColorClass} opacity-25`} />

      <div className={`${isFeature ? "mt-6 w-2/3" : "mt-3 w-3/5"} h-px bg-accent/30`} />

      <h3
        className={`${
          isFeature ? "mt-6 text-2xl" : "mt-3 text-lg"
        } line-clamp-2 text-center font-heading font-semibold italic leading-snug text-heading`}
      >
        {scientificName}
      </h3>

      <div className={`${isFeature ? "mt-8" : "mt-4"} w-full border-t border-dashed border-border/50 pt-2 text-center`}>
        <span className="text-[9px] font-bold uppercase tracking-wide text-muted">
          Field Sketch · Aroid Aaron&apos;s Notes
        </span>
      </div>
    </div>
  );
}
