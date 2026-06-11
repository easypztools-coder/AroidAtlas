import HeroSection from "@/components/HeroSection";
import FeaturedSpecies from "@/components/FeaturedSpecies";
import CompareSection from "@/components/CompareSection";
import MaturityJourney from "@/components/MaturityJourney";
import IdentifyPlant from "@/components/IdentifyPlant";
import GenusGrid from "@/components/GenusGrid";
import CollectionsGrid from "@/components/CollectionsGrid";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedSpecies />
      <CompareSection />
      <MaturityJourney />
      <IdentifyPlant />
      <GenusGrid />
      <CollectionsGrid />
    </>
  );
}