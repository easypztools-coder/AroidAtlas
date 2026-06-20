import spiritusSanctiData from "../../content/plants/philodendron/spiritus-sancti.json";
import billietiaeData from "../../content/plants/philodendron/billietiae-variegated.json";
import deltaForceData from "../../content/plants/anthurium/delta-force.json";
import venomData from "../../content/plants/alocasia/venom.json";
import devilMonsterData from "../../content/plants/monstera/devil-monster.json";

export interface PlantEntry {
  name: string;
  slug: string;
  scientificName: string;
  commonName: string;
  genus: string;
  origin: string;
  rarityStatus: string;
  priceGuideTier: string;
  description: string;
  imageSlug: string;
}

export interface GenusEntry {
  name: string;
  slug: string;
  speciesCount: number;
  description: string;
}

export interface CollectionEntry {
  name: string;
  slug: string;
  description: string;
  plantCount: number;
  gradient: string;
}

export interface HeroStats {
  label: string;
  value: string;
}

export const featuredPlants: PlantEntry[] = [
  {
    name: "Philodendron spiritus-sancti",
    slug: "spiritus-sancti",
    scientificName: "Philodendron spiritus-sancti",
    commonName: "Philodendron Spiritus Sancti",
    genus: "Philodendron",
    origin: "Espírito Santo, Brazil",
    rarityStatus: "Extremely Rare",
    priceGuideTier: spiritusSanctiData.priceGuideTier,
    description:
      "Legendary for its extraordinarily elongated, dangling lanceolate leaves. A prized specimen from a restricted wild habitat in Brazil, now becoming more accessible through micropropagation.",
    imageSlug: "spiritus-sancti",
  },
  {
    name: "Anthurium 'Delta Force'",
    slug: "delta-force",
    scientificName: "Anthurium clarinervium × pedatoradiatum 'Delta Force'",
    commonName: "Delta Force Anthurium",
    genus: "Anthurium",
    origin: "Miami, Florida, USA",
    rarityStatus: "Rare",
    priceGuideTier: deltaForceData.priceGuideTier,
    description:
      "A deliberate hybrid featuring velvet dark-green deltoid leaves with high-contrast bright white venation. A compact architectural masterpiece created by Steve Nock.",
    imageSlug: "delta-force",
  },
  {
    name: "Monstera 'Devil Monster'",
    slug: "devil-monster",
    scientificName: "Monstera 'Devil Monster'",
    commonName: "Devil Monster Monstera",
    genus: "Monstera",
    origin: "China (natural mutation) / Thailand (rebranded 2024)",
    rarityStatus: "Rare",
    priceGuideTier: devilMonsterData.priceGuideTier,
    description:
      "A unique cultivated variety featuring mint-coloured variegation on deeply lobed, rigid leaves. Gained prominence in Thailand in 2024.",
    imageSlug: "devil-monster",
  },
  {
    name: "Philodendron billietiae 'Variegated'",
    slug: "billietiae-variegated",
    scientificName: "Philodendron billietiae 'Variegated'",
    commonName: "Variegated Billietiae",
    genus: "Philodendron",
    origin: "French Guiana, Brazil",
    rarityStatus: "Rare",
    priceGuideTier: billietiaeData.priceGuideTier,
    description:
      "Stunning variegated form of the beloved billietiae, featuring long-stalked, elongated leaves with striking yellow to cream variegation and orange petioles.",
    imageSlug: "billietiae-variegated",
  },
  {
    name: "Alocasia × amazonica 'Venom'",
    slug: "venom",
    scientificName: "Alocasia × amazonica 'Venom'",
    commonName: "Venom Alocasia",
    genus: "Alocasia",
    origin: "South Korea (Mason Plants, 2019)",
    rarityStatus: "Rare",
    priceGuideTier: venomData.priceGuideTier,
    description:
      "A spontaneous mutation of Alocasia amazonica with a distinctive elongated, curling fang-like leaf tip and a soft, matte silvery-green coloration.",
    imageSlug: "venom",
  },
];

export const genera: GenusEntry[] = [
  {
    name: "Philodendron",
    slug: "philodendron",
    speciesCount: 25,
    description: "Diverse neotropical climbers with striking foliage",
  },
  {
    name: "Anthurium",
    slug: "anthurium",
    speciesCount: 21,
    description: "Velvet-leafed jewels of the rainforest understory",
  },
  {
    name: "Monstera",
    slug: "monstera",
    speciesCount: 17,
    description: "Iconic fenestrated giants of the tropical canopy",
  },
  {
    name: "Alocasia",
    slug: "alocasia",
    speciesCount: 16,
    description: "Dramatic shield-leafed specimens from Southeast Asia",
  },
  {
    name: "Other Aroids",
    slug: "other",
    speciesCount: 19,
    description: "Other rare climbing aroid genera including Amydrium, Rhaphidophora, Scindapsus, Epipremnum, Cercestis, and Pothos",
  },
];

export const collections: CollectionEntry[] = [
  {
    name: "Rare Climbers",
    slug: "rare-climbers",
    description: "Exceptional vining specimens for the discerning collector",
    plantCount: 12,
    gradient: "from-emerald-900/40 to-teal-900/20",
  },
  {
    name: "Variegated Beauties",
    slug: "variegated-beauties",
    description: "Striking variegated forms with unique colour patterns",
    plantCount: 8,
    gradient: "from-amber-900/30 to-yellow-900/20",
  },
  {
    name: "Collector Favorites",
    slug: "collector-favorites",
    description: "The most coveted species in the aroid community",
    plantCount: 15,
    gradient: "from-primary/20 to-primary/5",
  },
  {
    name: "Most Expensive",
    slug: "most-expensive",
    description: "The pinnacle of rarity commanding premium prices",
    plantCount: 6,
    gradient: "from-purple-900/40 to-pink-900/20",
  },
  {
    name: "Giant Aroids",
    slug: "giant-aroids",
    description: "Monumental species with impressive mature sizes",
    plantCount: 10,
    gradient: "from-green-900/40 to-blue-900/20",
  },
  {
    name: "New Discoveries",
    slug: "new-discoveries",
    description: "Recently described species and rediscovered treasures",
    plantCount: 7,
    gradient: "from-cyan-900/30 to-sky-900/20",
  },
];

export const heroStats: HeroStats[] = [
  { label: "Species & Cultivars", value: "1,744+" },
  { label: "Genera", value: "144+" },
  { label: "Countries", value: "36" },
  { label: "High Quality Images", value: "2,000+" },
];