import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compare Species — Coming Soon",
  description: "Compare care requirements, leaves morphology, pricing tiers, and collectors popularity ratings for rare tropical aroids.",
};

export default function ComparePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
          <svg className="h-7 w-7 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-heading font-bold text-heading">
          Compare Tool — Coming Soon
        </h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Side-by-side species comparison — morphology, care requirements, and live market data — is in development. Browse the species database in the meantime.
        </p>
        <Link href="/plants" className="btn-primary mt-8 inline-flex items-center gap-2">
          Browse Species
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
