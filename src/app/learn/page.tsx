import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Care Guides & Cultivation Resources",
  description: "Detailed care guidelines, propagation advice, and a botanical glossary for Monstera, Philodendron, Anthurium, and Alocasia collectors.",
  openGraph: {
    title: "Care Guides & Cultivation Resources | Aroid Atlas",
    description: "Detailed care guidelines, propagation advice, and a botanical glossary for Monstera, Philodendron, Anthurium, and Alocasia collectors.",
    url: "https://aroidatlas.co.uk/learn",
    siteName: "Aroid Atlas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Care Guides & Cultivation Resources | Aroid Atlas",
    description: "Detailed care guidelines, propagation advice, and a botanical glossary for Monstera, Philodendron, Anthurium, and Alocasia collectors.",
  },
};

interface GuideItem {
  id: string;
  title: string;
  category: string;
  icon: ReactNode;
  summary: string;
  tips: string[];
  relatedGenus?: string;
}

const CARE_GUIDES: GuideItem[] = [
  {
    id: "substrate",
    category: "Substrate & Soil",
    title: "The Ultimate Chunky Aroid Mix",
    relatedGenus: "philodendron",
    summary: "Rare tropical aroids are mostly epiphytic or hemiepiphytic. They need highly aerated, chunky substrates to prevent root rot while retaining moisture.",
    tips: [
      "Base: 40% Orchid Bark or Coconut Husk chips for structure",
      "Aeration: 30% Perlite or Pumice for drainage",
      "Moisture: 20% Sphagnum Moss or Coco Coir",
      "Nutrients: 10% Worm Castings & Activated Charcoal to purify",
    ],
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M5.3 5.3l13.4 13.4M5.3 18.7L18.7 5.3" />
      </svg>
    ),
  },
  {
    id: "lighting",
    category: "Lighting & PPFD",
    title: "Bright Indirect Light Demystified",
    relatedGenus: "monstera",
    summary: "Forest canopy climbers receive dappled shade in the wild. Direct sun burns delicate leaves, while low light leads to leggy growth and loss of variegation.",
    tips: [
      "Exposure: East or West facing windows are ideal",
      "PPFD Range: 100-200 µmol/m²/s for optimal growth",
      "Variegated Plants: Require higher light levels to support non-chlorophyll sectors",
      "Grow Lights: 12-14 hours photoperiod using full-spectrum LED fixtures",
    ],
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M3 12h2.25m13.5 0H21M4.22 19.78l1.59-1.59m12.38-12.38l1.59-1.59M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
      </svg>
    ),
  },
  {
    id: "humidity",
    category: "Climate & Airflow",
    title: "Humidity vs. Air Circulation",
    relatedGenus: "anthurium",
    summary: "High humidity keeps growth points moist and helps aerial roots attach. However, stagnant air invites fungal pathogens. Active ventilation is key.",
    tips: [
      "Target RH: 65% - 85% relative humidity for rare species",
      "Airflow: Maintain continuous ambient breeze using low-speed fans",
      "Foliage: Avoid leaving water drops sitting on leaves overnight",
      "Moss Poles: Keep poles consistently damp to encourage larger leaves",
    ],
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75V3m-3 3L8.25 3M11.25 6L8.25 3m6 18V8.25m-3 3l3-3m3 3l-3-3" />
      </svg>
    ),
  },
  {
    id: "watering",
    category: "Hydration & Feed",
    title: "Watering & Mineral Nutrition",
    relatedGenus: "alocasia",
    summary: "Overwatering is the number one killer of rare collectibles. Water when the top 50% of the pot dries, and fertilize weakly with every watering.",
    tips: [
      "Method: Drench thoroughly until water runs out the bottom, then dry",
      "Water Type: Rainwater or RO (reverse osmosis) water for sensitive Anthuriums",
      "NPK Ratio: Use balanced nitrogen-heavy formulas (e.g. 9-3-6 or 3-1-2)",
      "Flushing: Flush substrate with pure water monthly to remove salt build-ups",
    ],
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
  },
];

interface GlossaryTerm {
  term: string;
  definition: string;
  example: string;
  plantLink?: { label: string; href: string };
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "Fenestration",
    definition: "Naturally occurring holes or splits in a leaf blade, characteristic of mature Monstera species, adapted to allow wind and rain to pass through without tearing the leaf.",
    example: "Monstera deliciosa, Monstera esqueleto",
    plantLink: { label: "Browse Monstera", href: "/plants/monstera" },
  },
  {
    term: "Epiphyte",
    definition: "A plant that grows harmlessly upon another plant (such as a tree canopy host) and derives its moisture and nutrients from the air, rain, and debris surrounding it.",
    example: "Anthurium veitchii, many Philodendrons",
    plantLink: { label: "Browse Anthurium", href: "/plants/anthurium" },
  },
  {
    term: "Variegation",
    definition: "The appearance of differently colored zones (usually white, cream, or yellow) in leaves or stems due to genetic mutation or chimera, leading to zones lacking chlorophyll.",
    example: "Monstera albo-variegata, Philodendron caramel marble",
    plantLink: { label: "Browse Variegated", href: "/collections/variegated-beauties" },
  },
  {
    term: "Node",
    definition: "The critical structural point on a stem where leaves, buds, and aerial roots originate. A cutting must contain at least one node to be propagated successfully.",
    example: "All climbing Araceae",
    plantLink: { label: "Browse Climbers", href: "/collections/rare-climbers" },
  },
  {
    term: "Petiolar Sheath",
    definition: "A wing-like structure or sheath flanking the leaf stem (petiole) that protects emerging new leaves before they unfurl.",
    example: "Philodendron billietiae, Epipremnum pinnatum",
    plantLink: { label: "Browse Philodendron", href: "/plants/philodendron" },
  },
  {
    term: "Bullate",
    definition: "A leaf texture described as puckered, blistered, or heavily wrinkled, usually an adaptation to increase surface area for light absorption in low-light rain forest floors.",
    example: "Anthurium luxurians, Alocasia rugosa",
    plantLink: { label: "Browse Anthurium", href: "/plants/anthurium" },
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://aroidatlas.co.uk/learn#article",
      headline: "Care Guides & Cultivation Resources for Rare Tropical Aroids",
      description:
        "Detailed care guidelines, propagation advice, and a botanical glossary for Monstera, Philodendron, Anthurium, and Alocasia collectors.",
      url: "https://aroidatlas.co.uk/learn",
      publisher: {
        "@type": "Organization",
        name: "Aroid Atlas",
        url: "https://aroidatlas.co.uk",
      },
      author: {
        "@type": "Person",
        name: "Aroid Aaron",
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://aroidatlas.co.uk" },
        { "@type": "ListItem", position: 2, name: "Care Guides", item: "https://aroidatlas.co.uk/learn" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: GLOSSARY_TERMS.map((t) => ({
        "@type": "Question",
        name: `What does ${t.term} mean in botany?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: t.definition,
        },
      })),
    },
  ],
};

export default function LearnPage() {
  return (
    <div className="section-spacing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="section-container">
        {/* Header Block */}
        <div className="mb-12 max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-heading mb-4">
            Care Guides & Cultivation Resources
          </h1>
          <p className="text-sm md:text-base text-muted leading-relaxed">
            Cultivating rare tropical aroids is both an art and a science. Browse our core guides on environmental setup, substrate management, and a comprehensive glossary of botanical terminology used by collectors.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {CARE_GUIDES.map((guide) => (
            <div key={guide.id} className="glass-card-hover p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {guide.icon}
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">
                    {guide.category}
                  </span>
                </div>
                <h3 className="text-lg font-heading font-bold text-heading mb-3">
                  {guide.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed mb-6">
                  {guide.summary}
                </p>
              </div>

              <div className="border-t border-primary/5 pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">
                  Key Guidelines
                </h4>
                <ul className="space-y-2 text-xs text-muted-light">
                  {guide.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/45 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                {guide.relatedGenus && (
                  <Link
                    href={`/plants/${guide.relatedGenus}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    Explore {guide.relatedGenus.charAt(0).toUpperCase() + guide.relatedGenus.slice(1)} species
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botanical Glossary Section */}
        <div className="border-t border-primary/10 pt-12">
          <div className="mb-8">
            <h2 className="section-heading mb-3">Botanical Glossary</h2>
            <p className="section-subheading">
              Understand the specific scientific terms and terminology used across species profiles and care documentation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GLOSSARY_TERMS.map((term, index) => (
              <div key={index} className="rounded-xl border border-primary/5 bg-card/30 p-5 hover:bg-card-hover/40 transition-colors">
                <h3 className="text-sm font-heading font-bold text-heading mb-2">
                  {term.term}
                </h3>
                <p className="text-xs text-muted leading-relaxed mb-3">
                  {term.definition}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-light italic">
                  <span className="font-semibold not-italic text-primary">e.g.</span>
                  <span>{term.example}</span>
                </div>
                {term.plantLink && (
                  <Link
                    href={term.plantLink.href}
                    className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors"
                  >
                    {term.plantLink.label}
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Browse Button */}
        <div className="mt-16 text-center">
          <Link href="/plants" className="btn-primary">
            Explore Plant Species
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
