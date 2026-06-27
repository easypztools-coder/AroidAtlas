import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Aroid Atlas & Methodology",
  description: "Learn about the mission, data collection methodologies, statistical filtering, and active retail integrations powering the Aroid Atlas visual encyclopedia.",
  openGraph: {
    title: "About Aroid Atlas & Methodology",
    description: "Learn about the mission, data collection methodologies, statistical filtering, and active retail integrations powering the Aroid Atlas visual encyclopedia.",
    url: "https://aroidatlas.co.uk/about",
    siteName: "Aroid Atlas",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Aroid Atlas & Methodology",
    description: "Learn about the mission, data collection methodologies, and active retail integrations powering Aroid Atlas.",
  },
};

export default function AboutPage() {
  return (
    <div className="section-spacing">
      <div className="section-container">
        {/* Header Block */}
        <div className="mb-12 max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-heading mb-4">
            About Aroid Atlas
          </h1>
          <p className="text-sm md:text-base text-muted leading-relaxed">
            Aroid Atlas is a specialized visual encyclopedia and market index for rare tropical plants in the family Araceae (Aroids). Built for serious collectors, commercial nurseries, and botanists, we bridge the gap between scientific botanical metadata and real-world market valuation.
          </p>
        </div>

        {/* Core Pillars */}
        <h2 className="sr-only">Our Approach</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="glass-card-hover p-6">
            <h3 className="text-sm font-heading font-bold text-heading mb-2">Botanical Accuracy</h3>
            <p className="text-xs text-muted leading-relaxed">
              Every species profile is compiled with structured taxonomic data—documenting geographical origin, growth habit, morphology (leaf shape, texture, size), and care requirements.
            </p>
          </div>
          <div className="glass-card-hover p-6">
            <h3 className="text-sm font-heading font-bold text-heading mb-2">Market Intelligence</h3>
            <p className="text-xs text-muted leading-relaxed">
              We aggregate weekly historical sales data to track market velocity, volatility, and value ranges, offering an empirical valuation guide in an otherwise speculative market.
            </p>
          </div>
          <div className="glass-card-hover p-6">
            <h3 className="text-sm font-heading font-bold text-heading mb-2">Retail Integration</h3>
            <p className="text-xs text-muted leading-relaxed">
              We scan and index availability from premium UK nurseries, comparing live store pricing with auction listings to help buyers find the best deals.
            </p>
          </div>
        </div>

        {/* Pricing Methodology Section */}
        <div className="border-t border-primary/10 pt-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <h2 className="section-heading mb-3">Market Valuation Methodology</h2>
              <p className="text-xs text-muted leading-relaxed">
                Calculating the value of rare plants is highly complex due to fluctuations in leaf counts, variegation quality, and seasonal demand. Here is how our statistical pipeline handles this data:
              </p>
            </div>
            
            <div className="lg:col-span-8 space-y-6">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-heading mb-1">eBay UK Sold Comparables (Comps)</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    We crawl and log completed transaction prices from eBay UK auctions weekly. This records raw market transaction prices for real plant specimens sold between collectors.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-heading mb-1">Statistical Outlier & Keyword Filtering</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Raw scraping captures noise—seeds, artificial leaves, pots, or shipping fees. Our ingestion pipeline parses listing titles to filter out irrelevant items. We also use a **20% Trimmed Mean algorithm** to remove extreme statistical outliers (scam listings or extremely high-priced large specimens) from the weekly average.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">3</div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-heading mb-1">Retail Price Aggregation</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    In parallel, our crawlers scan stock availability across leading online plant retail shops. This provides the *Retail Value Guide* which displays stable store prices including VAT, providing context on whether it is cheaper to buy from a nursery or bid in an auction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Callout */}
        <div className="glass-card bg-rarity/5 border-rarity/20 p-6 md:p-8 mb-12">
          <div className="flex items-start gap-4">
            <svg className="h-6 w-6 text-rarity shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-heading font-bold text-[#E6C687] mb-2">Market Volatility Disclaimer</h3>
              <p className="text-xs text-muted leading-relaxed">
                The prices shown on Aroid Atlas are historical statistics computed using automated calculations and models. They represent estimates of general market trends and should not be taken as absolute valuations or financial advice. The rare plant market is highly volatile, and prices can fluctuate heavily based on seasonal weather, shipping conditions, and current trend aesthetics.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="flex justify-center gap-4">
          <Link href="/plants" className="btn-primary">
            Explore Species
          </Link>
          <Link href="/compare" className="btn-secondary">
            Compare Species
          </Link>
        </div>
      </div>
    </div>
  );
}
