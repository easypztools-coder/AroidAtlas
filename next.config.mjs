/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      // Ensure API routes can read price and retail snapshot JSON at runtime
      "/api/plants/[slug]/price-history": ["./content/price-snapshots/**/*.json"],
      "/api/plants/[slug]/retail-market": ["./content/retail-snapshots/**/*.json"],
      "/api/admin/prices/update": ["./content/plants/**/*.json"],
    },
    outputFileTracingExcludes: {
      // Exclude large botanical plate images from the function bundle
      "/api/cron/update-retail-prices": ["./content/plants/**/*.png"],
    },
  },
};

export default nextConfig;
