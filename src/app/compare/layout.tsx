import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Specimen Comparison Tool",
  description: "Compare rare tropical aroids side by side — morphology, rarity, pricing, and care requirements. Find your perfect specimen.",
  openGraph: {
    title: "Specimen Comparison Tool | Aroid Atlas",
    description: "Compare rare tropical aroids side by side — morphology, rarity, pricing, and care requirements.",
    url: "https://aroidatlas.co.uk/compare",
    siteName: "Aroid Atlas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Specimen Comparison Tool | Aroid Atlas",
    description: "Compare rare tropical aroids side by side — morphology, rarity, pricing, and care requirements.",
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
