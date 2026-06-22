import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="text-center max-w-lg">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
          <svg
            className="h-9 w-9 text-primary/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Heading */}
        <p className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-3">
          404 — Specimen Not Found
        </p>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4 leading-tight">
          This page has gone back to the wild.
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-10 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Head back to the species database to continue exploring.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/plants" className="btn-primary">
            Browse Species
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-12 border-t border-primary/10 pt-8">
          <p className="text-xs text-muted/60 mb-4">Popular genera</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["philodendron", "anthurium", "monstera", "alocasia", "begonia"].map((genus) => (
              <Link
                key={genus}
                href={`/plants/${genus}`}
                className="rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs text-muted capitalize hover:border-primary/30 hover:text-primary transition-colors duration-200"
              >
                {genus}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
