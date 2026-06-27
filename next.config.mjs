/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // Plant images are content-addressed (slug = filename) and never change
        source: "/plants/:genus/:slug.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/api/plants/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600" },
        ],
      },
    ];
  },

  experimental: {
    outputFileTracingIncludes: {
      "/api/plants/[slug]/price-history": ["./content/price-snapshots/**/*.json"],
      "/api/plants/[slug]/retail-market": ["./content/retail-snapshots/**/*.json"],
      "/api/admin/prices/update": ["./content/plants/**/*.json"],
    },
    outputFileTracingExcludes: {
      "/api/cron/update-retail-prices": ["./content/plants/**/*.png"],
    },
  },
};

export default nextConfig;
