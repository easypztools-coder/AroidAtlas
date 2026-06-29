import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import PlantDetailPage from "@/components/PlantDetailPage";

interface PricePoint {
  date: string;
  medianPriceGBP: number;
  dataPointsAnalyzed: number;
}

interface RecommendedPlant {
  name: string;
  slug: string;
  rarity: string;
  price: string;
}

interface QuickFacts {
  growthHabit: string;
  matureSize: string;
  light: string;
  humidity: string;
  temperature: string;
  difficulty: string;
  growthSpeed: string;
}

interface Morphology {
  leafShape: string;
  leafLength: string;
  leafWidth: string;
  petioleColor: string;
  venation: string;
  texture: string;
  variegation: string;
  growthHabit: string;
}

interface PlantData {
  name: string;
  slug: string;
  scientificName: string;
  commonName: string;
  statusTag: string;
  botanicalType: string;
  family: string;
  genus: string;
  species: string;
  origin: string;
  collectorPopularity: number;
  rarityStatus: string;
  availability: string;
  priceGuideTier: string;
  aboutText: string;
  quickFacts: QuickFacts;
  morphology: Morphology;
  marketMetrics: {
    currentMedianPriceGBP: number | null;
    threeMonthChangePercent: number | null;
    marketStatus: string | null;
  };
  priceHistory?: PricePoint[];
  recommendedPlants: RecommendedPlant[];
}

function loadPlantData(genus: string, slug: string): { data: PlantData; mtime: Date } | null {
  try {
    const filePath = path.join(
      process.cwd(),
      "content",
      "plants",
      genus.toLowerCase(),
      `${slug}.json`
    );
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const mtime = fs.statSync(filePath).mtime;
    return { data: JSON.parse(raw) as PlantData, mtime };
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  const params: { genus: string; slug: string }[] = [];

  if (fs.existsSync(plantsRoot)) {
    const folders = fs.readdirSync(plantsRoot).filter((f) => {
      return fs.statSync(path.join(plantsRoot, f)).isDirectory();
    });

    for (const genus of folders) {
      const dirPath = path.join(plantsRoot, genus);
      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));

      for (const file of files) {
        params.push({
          genus,
          slug: file.replace(".json", ""),
        });
      }
    }
  }

  return params;
}

interface PageProps {
  params: { genus: string; slug: string };
}

function trimDescription(text: string, maxLen = 155): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + "…";
}

function buildMetaDescription(data: PlantData): string {
  if (data.marketMetrics.currentMedianPriceGBP) {
    const price = Math.round(data.marketMetrics.currentMedianPriceGBP);
    const year = new Date().getFullYear();
    return `${data.scientificName} costs around £${price} in the UK (${year}). Discover care tips, rarity data and live price history on Aroid Atlas.`;
  }
  return trimDescription(data.aboutText);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genus, slug } = params;
  const result = loadPlantData(genus, slug);
  if (!result) return { title: "Plant Not Found" };
  const { data } = result;

  const description = buildMetaDescription(data);
  const canonicalUrl = `https://aroidatlas.co.uk/plants/${genus.toLowerCase()}/${slug}`;

  return {
    title: `${data.scientificName} — ${data.commonName}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${data.scientificName} | Aroid Atlas`,
      description,
      url: canonicalUrl,
      siteName: "Aroid Atlas",
      images: [
        {
          url: `/plants/${genus.toLowerCase()}/${data.slug}.png`,
          width: 1200,
          height: 900,
          alt: `${data.scientificName} — ${data.statusTag}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.scientificName} | Aroid Atlas`,
      description,
    },
  };
}

export default function PlantPage({ params }: PageProps) {
  const { genus, slug } = params;
  const result = loadPlantData(genus, slug);

  if (!result) {
    notFound();
  }

  const { data, mtime } = result;
  const baseUrl = "https://aroidatlas.co.uk";
  const genusSlug = genus.toLowerCase();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${data.scientificName} — ${data.commonName} Care, Rarity & Price Guide`,
        description: data.aboutText,
        dateModified: mtime.toISOString(),
        about: {
          "@type": "Thing",
          name: data.scientificName,
          alternateName: data.commonName,
        },
        author: {
          "@type": "Organization",
          name: "Aroid Atlas",
          url: baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "Aroid Atlas",
          url: baseUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Species",
            item: `${baseUrl}/plants`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: data.genus,
            item: `${baseUrl}/plants/${genusSlug}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: data.scientificName,
            item: `${baseUrl}/plants/${genusSlug}/${data.slug}`,
          },
        ],
      },
      ...(data.marketMetrics.currentMedianPriceGBP
        ? [
            {
              "@type": "Product",
              name: data.scientificName,
              image: `${baseUrl}/plants/${genusSlug}/${data.slug}.png`,
              description: data.aboutText.slice(0, 500),
              brand: {
                "@type": "Brand",
                name: data.genus,
              },
              offers: {
                "@type": "Offer",
                priceCurrency: "GBP",
                price: data.marketMetrics.currentMedianPriceGBP,
                availability: "https://schema.org/LimitedAvailability",
                seller: {
                  "@type": "Organization",
                  name: "Aroid Atlas",
                },
                shippingDetails: {
                  "@type": "OfferShippingDetails",
                  shippingRate: {
                    "@type": "MonetaryAmount",
                    value: "0.00",
                    currency: "GBP",
                  },
                  shippingDestination: {
                    "@type": "DefinedRegion",
                    addressCountry: "GB",
                  },
                  deliveryTime: {
                    "@type": "ShippingDeliveryTime",
                    handlingTime: {
                      "@type": "QuantitativeValue",
                      minValue: 0,
                      maxValue: 1,
                    },
                    transitTime: {
                      "@type": "QuantitativeValue",
                      minValue: 1,
                      maxValue: 3,
                    },
                  },
                },
                hasMerchantReturnPolicy: {
                  "@type": "MerchantReturnPolicy",
                  applicableCountry: "GB",
                  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                  merchantReturnDays: 14,
                  returnFees: "https://schema.org/ReturnFeesCustomerPaying",
                  returnMethod: "https://schema.org/ReturnByMail",
                },
              },
              ...(data.collectorPopularity
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: data.collectorPopularity,
                      reviewCount: Math.round(data.collectorPopularity * 4) || 12,
                      bestRating: 5,
                      worstRating: 1,
                    },
                    review: {
                      "@type": "Review",
                      author: {
                        "@type": "Person",
                        name: "Aroid Atlas Collector",
                      },
                      datePublished: mtime.toISOString().split("T")[0],
                      reviewBody: `Aroid Atlas collector review: ${data.scientificName} (${data.commonName}) is ranked as ${data.rarityStatus} and is highly sought after by collectors. Rating based on cultivation difficulty, aesthetic popularity, and price index stability.`,
                      reviewRating: {
                        "@type": "Rating",
                        ratingValue: data.collectorPopularity,
                        bestRating: 5,
                        worstRating: 1,
                      },
                    },
                  }
                : {}),
            },
          ]
        : []),
      {
        "@type": "FAQPage",
        mainEntity: [
          ...(data.marketMetrics.currentMedianPriceGBP
            ? [
                {
                  "@type": "Question",
                  name: `How much does a ${data.scientificName} cost?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `A ${data.commonName} (${data.scientificName}) typically costs around £${Math.round(data.marketMetrics.currentMedianPriceGBP)} in the UK based on recent eBay UK sold comparables. It is classified as ${data.rarityStatus} and rated ${data.priceGuideTier} on the collector market.`,
                  },
                },
              ]
            : []),
          {
            "@type": "Question",
            name: `Is ${data.scientificName} rare?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${data.scientificName} is classified as ${data.rarityStatus}. Availability is described as ${data.availability}. It originates from ${data.origin} and is considered a ${data.statusTag ? data.statusTag + " " : ""}collector specimen.`,
            },
          },
          {
            "@type": "Question",
            name: `Where can I buy ${data.commonName}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${data.commonName} (${data.scientificName}) can be found on eBay UK, specialist aroid nurseries, and private collector groups. Aroid Atlas tracks live UK market prices to help you pay a fair price.`,
            },
          },
          ...(data.quickFacts?.light
            ? [
                {
                  "@type": "Question",
                  name: `What light does ${data.scientificName} need?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `${data.scientificName} requires ${data.quickFacts.light}. As a ${data.botanicalType} from ${data.origin}, it thrives in conditions that replicate its natural forest habitat.`,
                  },
                },
              ]
            : []),
          ...(data.quickFacts?.humidity
            ? [
                {
                  "@type": "Question",
                  name: `What humidity does ${data.scientificName} need?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `${data.scientificName} prefers ${data.quickFacts.humidity} humidity. Maintaining adequate humidity is important for healthy leaf development and preventing tip browning.`,
                  },
                },
              ]
            : []),
          ...(data.quickFacts?.difficulty
            ? [
                {
                  "@type": "Question",
                  name: `Is ${data.scientificName} easy to care for?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `${data.scientificName} is rated as ${data.quickFacts.difficulty} difficulty. ${data.quickFacts.growthSpeed ? `It has a ${data.quickFacts.growthSpeed} growth rate. ` : ""}It is best suited for collectors with experience growing rare tropical aroids.`,
                  },
                },
              ]
            : []),
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlantDetailPage data={data} genus={genus.toLowerCase()} />
    </>
  );
}
