import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Care Guides & Resources — Coming Soon",
  description: "Browse detailed cultivation resources, care guides, and a botanical glossary for Monstera, Philodendron, Anthurium, and Alocasia.",
};

export default function LearnPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
          <svg className="h-7 w-7 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <h1 className="text-2xl font-heading font-bold text-heading">
          Care Guides & Resources — Coming Soon
        </h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Detailed care guides, glossary, and cultivation resources for aroid collectors are in development. Find care data on individual species pages for now.
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
