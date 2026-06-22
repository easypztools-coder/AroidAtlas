import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visual Specimen Identification",
  description: "Upload a photo to identify rare tropical aroids. Powered by visual pattern matching across our full specimen database.",
  openGraph: {
    title: "Visual Specimen Identification | Aroid Atlas",
    description: "Upload a photo to identify rare tropical aroids. Powered by visual pattern matching across our full specimen database.",
    url: "https://aroidatlas.com/identify",
    siteName: "Aroid Atlas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visual Specimen Identification | Aroid Atlas",
    description: "Upload a photo to identify rare tropical aroids across our full specimen database.",
  },
};

export default function IdentifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
