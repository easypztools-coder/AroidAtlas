export default function Loading() {
  return (
    <div className="section-spacing animate-pulse">
      <div className="section-container">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-3 w-12 rounded bg-card/80" />
          <div className="h-3 w-2 rounded bg-card/60" />
          <div className="h-3 w-20 rounded bg-card/80" />
          <div className="h-3 w-2 rounded bg-card/60" />
          <div className="h-3 w-32 rounded bg-card/60" />
        </div>

        {/* Title skeleton */}
        <div className="mb-2 h-9 w-72 rounded-lg bg-card/80" />
        <div className="mb-8 h-5 w-48 rounded bg-card/60" />

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-10">
          {/* Content column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Image placeholder */}
            <div className="aspect-[3/4] max-h-96 w-full rounded-2xl bg-card/80" />

            {/* Text blocks */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="glass-card p-5 space-y-3">
                <div className="h-4 w-28 rounded bg-card/80" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 w-24 rounded bg-card/60" />
                    <div className="h-3 w-20 rounded bg-card/60" />
                  </div>
                ))}
              </div>
              <div className="glass-card p-5 space-y-3">
                <div className="h-4 w-24 rounded bg-card/80" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-3 rounded bg-card/60" style={{ width: `${70 + i * 5}%` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card p-5 space-y-3">
              <div className="h-4 w-24 rounded bg-card/80" />
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-16 rounded bg-card/60" />
                  <div className="h-3 w-20 rounded bg-card/60" />
                </div>
              ))}
            </div>

            {/* Price KPI skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card p-4 space-y-2">
                  <div className="h-3 w-16 rounded bg-card/60" />
                  <div className="h-6 w-20 rounded bg-card/80" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
