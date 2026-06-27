import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import FeaturedSpecies from "@/components/FeaturedSpecies";
import GenusGrid from "@/components/GenusGrid";
import PriceMethodology from "@/components/PriceMethodology";
import ExploreCTA from "@/components/ExploreCTA";

export const metadata: Metadata = {
  title: "Rare Plant Price Guide — Live UK Market Data for Aroids",
  description:
    "Know what every rare aroid is actually worth. Live eBay UK auction data and retailer prices for 170+ collector species — updated automatically every week.",
  openGraph: {
    url: "https://aroidatlas.co.uk",
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeaturedSpecies />
      <GenusGrid />
      <PriceMethodology />
      <ExploreCTA />
    </>
  );
}
