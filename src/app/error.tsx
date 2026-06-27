"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          Something went wrong
        </p>
        <h1 className="text-2xl font-heading font-bold text-heading mb-3">
          Unexpected error
        </h1>
        <p className="text-sm text-muted mb-8">
          An unexpected error occurred. You can try again or return to the plant directory.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg border border-primary/30 px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            Try again
          </button>
          <Link href="/plants" className="btn-primary">
            Browse Species
          </Link>
        </div>
      </div>
    </div>
  );
}
