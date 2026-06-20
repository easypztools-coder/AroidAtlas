import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms of service of Ariod Atlas to understand rules, guidelines, and agreements for using our visual encyclopedia.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
          <svg className="h-7 w-7 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-heading font-bold text-heading">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Our full terms of service are being drafted. By using Ariod Atlas you agree to use the site for lawful purposes only. This page will be updated shortly.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex items-center gap-2">
          Back to Home
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
