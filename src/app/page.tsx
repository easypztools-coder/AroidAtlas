import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import FeaturedSpecies from "@/components/FeaturedSpecies";
import GenusGrid from "@/components/GenusGrid";
import ExploreCTA from "@/components/ExploreCTA";

export const metadata: Metadata = {
  title: "The Visual Encyclopedia of Rare Tropical Plants",
  description:
    "Discover, explore and compare the world's most extraordinary aroids. Live market prices, species profiles, and cultivation data for serious collectors.",
  openGraph: {
    url: "https://aroidatlas.co.uk",
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedSpecies />
      <GenusGrid />
      <ExploreCTA />
    </>
  );
}
