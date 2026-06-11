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
    commonName: "The Holy Grail Philodendron",
    genus: "Philodendron",
    origin: "Espírito Santo, Brazil",
    rarityStatus: "Extremely Rare",
    priceGuideTier: "££££",
    description:
      "Legendary for its extraordinarily elongated, dangling lanceolate leaves. A prized specimen from a restricted wild habitat in Brazil, now becoming more accessible through micropropagation.",
    imageSlug: "spiritus-sancti",
  },
  {
    name: "Anthurium warocqueanum",
    slug: "warocqueanum",
    scientificName: "Anthurium warocqueanum",
    commonName: "Queen Anthurium",
    genus: "Anthurium",
    origin: "Colombia",
    rarityStatus: "Very Rare",
    priceGuideTier: "£££",
    description:
      "Regal anthurium with large, velvety dark green leaves and striking silver venation. A crown jewel of any aroid collection, demanding high humidity and careful cultivation.",
    imageSlug: "warocqueanum",
  },
  {
    name: "Monstera burle marx flame",
    slug: "burle-marx-flame",
    scientificName: "Monstera burle marx flame",
    commonName: "Burle Marx Flame",
    genus: "Monstera",
    origin: "Brazil",
    rarityStatus: "Rare",
    priceGuideTier: "£££",
    description:
      "A highly sought-after Monstera with unique flame-patterned variegation and elongated leaves. Named after the legendary Brazilian landscape architect Roberto Burle Marx.",
    imageSlug: "burle-marx-flame",
  },
  {
    name: "Philodendron billietiae 'Variegated'",
    slug: "billietiae-variegated",
    scientificName: "Philodendron billietiae 'Variegated'",
    commonName: "Variegated Billietiae",
    genus: "Philodendron",
    origin: "French Guiana, Brazil",
    rarityStatus: "Rare",
    priceGuideTier: "£££",
    description:
      "Stunning variegated form of the beloved billietiae, featuring long-stalked, elongated leaves with striking yellow to cream variegation and orange petioles.",
    imageSlug: "billietiae-variegated",
  },
  {
    name: "Anthurium luxurians",
    slug: "luxurians",
    scientificName: "Anthurium luxurians",
    commonName: "Luxuriant Anthurium",
    genus: "Anthurium",
    origin: "Colombia",
    rarityStatus: "Uncommon",
    priceGuideTier: "££",
    description:
      "Known for its incredibly bullate (blistered) leaf texture and dark green coloration. A textural masterpiece that brings depth and dimension to any collection.",
    imageSlug: "luxurians",
  },
];

export const genera: GenusEntry[] = [
  {
    name: "Philodendron",
    slug: "philodendron",
    speciesCount: 489,
    description: "Diverse neotropical climbers with striking foliage",
  },
  {
    name: "Anthurium",
    slug: "anthurium",
    speciesCount: 1000,
    description: "Velvet-leafed jewels of the rainforest understory",
  },
  {
    name: "Monstera",
    slug: "monstera",
    speciesCount: 48,
    description: "Iconic fenestrated giants of the tropical canopy",
  },
  {
    name: "Alocasia",
    slug: "alocasia",
    speciesCount: 79,
    description: "Dramatic shield-leafed specimens from Southeast Asia",
  },
  {
    name: "Homalomena",
    slug: "homalomena",
    speciesCount: 128,
    description: "Understory elegance with heart-shaped foliage",
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