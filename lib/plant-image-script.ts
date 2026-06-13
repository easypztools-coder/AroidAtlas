/**
 * AroidAtlas Plant Image Prompt Generator
 *
 * Generates scientifically accurate botanical plate prompts
 * for rare tropical plants, reusable for any species.
 */

export interface SpeciesData {
  name: string;
  family: string;
  genus: string;
  species: string;

  morphology: {
    leaf_shape: string;
    leaf_ratio: string;
    texture: string;
    petiole: string;
    growth_habit: string;
    mature_size: string;
  };

  critical_traits: string[];
  negative_traits: string[];

  habitat: string;
  origin: string;
}

function buildMasterStyleTemplate(data: SpeciesData): string {
  return `
AROIDATLAS BOTANICAL PLATE — ${data.name}

Create a museum-quality botanical plate of ${data.name} suitable for a premium digital encyclopedia of rare tropical plants.

STYLE REQUIREMENTS

- Scientific botanical illustration
- Natural history museum quality
- Photorealistic rendering
- Botanical accuracy prioritized over aesthetics
- Cream archival paper background
- Elegant editorial design
- Premium field-guide aesthetic
- Soft studio lighting
- No fantasy elements
- No artistic liberties

LAYOUT REQUIREMENTS

Central specimen of ${data.name} occupies approximately 60 percent of the composition.

Left information panel:

- scientific name: ${data.name}
- family: ${data.family}
- genus: ${data.genus}
- species: ${data.species}
- origin: ${data.origin}

Right information panel:

Circular morphology callouts showing:

- leaf detail
- petiole detail
- aerial roots
- inflorescence

Lower panel:

- habitat: ${data.habitat}
- native range map
- morphology summary

The page should resemble a luxury botanical atlas plate.

WATERMARK

- Include the Aroid Atlas logo watermark discreetly in the lower-right corner of the plate
- The watermark should be semi-transparent, small, and not obscure any botanical details
- Logo consists of the text "AROIDATLAS" in a clean, modern sans-serif typeface
`.trim();
}

function buildMorphologySection(data: SpeciesData): string {
  return `
BOTANICAL ACCURACY REQUIREMENTS

Critical identifying traits for ${data.name}:

${data.critical_traits.map((t) => `- ${t}`).join("\n")}

Morphology:

Leaf Shape:
${data.morphology.leaf_shape}

Leaf Ratio:
${data.morphology.leaf_ratio}

Texture:
${data.morphology.texture}

Petiole:
${data.morphology.petiole}

Growth Habit:
${data.morphology.growth_habit}

Mature Size:
${data.morphology.mature_size}

Origin:
${data.origin}

Habitat:
${data.habitat}

The specimen of ${data.name} should immediately be recognizable to an experienced collector.

Failure to accurately reproduce species-defining morphology should be considered incorrect.
`.trim();
}

function buildNegativeConstraints(data: SpeciesData): string {
  if (!data.negative_traits || data.negative_traits.length === 0) {
    return "Do not generate:\n\n(none)";
  }

  return `Do not generate:

${data.negative_traits.map((t) => `- ${t}`).join("\n")}`;
}

/**
 * Generates a complete image-generation prompt for a given plant species.
 *
 * @param speciesData - The structured data describing the plant species.
 * @returns A single, combined prompt string ready for an image generator.
 */
export function generatePlantImagePrompt(speciesData: SpeciesData): string {
  const sections: string[] = [
    buildMasterStyleTemplate(speciesData),
    "--------------------------------",
    "SPECIES MORPHOLOGY",
    "--------------------------------",
    buildMorphologySection(speciesData),
    "--------------------------------",
    "NEGATIVE CONSTRAINTS",
    "--------------------------------",
    buildNegativeConstraints(speciesData),
    "--------------------------------",
    "FINAL REQUIREMENT",
    "--------------------------------",
    "Botanical accuracy is the highest priority.",
    "The illustration style may be stylized.",
    "The morphology must remain faithful to real specimens.",
    "",
    "REFERENCE IMAGE (if provided)",
    "If a reference image of the actual plant is attached, use it as a strict visual guide for morphology, proportions, and colouration. The generated plate must match the reference specimen closely.",
  ];

  return sections.join("\n\n");
}