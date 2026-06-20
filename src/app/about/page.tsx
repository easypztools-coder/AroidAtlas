import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Ariod Atlas",
  description: "Learn more about the mission, data collection methodology, and team behind the Ariod Atlas tropical plant visual encyclopedia.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
          <svg className="h-7 w-7 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <h1 className="text-2xl font-heading font-bold text-heading">
          About Ariod Atlas
        </h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Ariod Atlas is the definitive visual encyclopedia of rare tropical plants — built for serious collectors, botanists, and plant enthusiasts. This page is being expanded.
        </p>
        <Link href="/plants" className="btn-primary mt-8 inline-flex items-center gap-2">
          Explore Species
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
