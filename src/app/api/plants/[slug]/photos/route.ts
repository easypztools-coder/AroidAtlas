import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GENERA = ["alocasia", "anthurium", "begonia", "monstera", "philodendron", "other"];

function findPlantData(slug: string): { scientificName: string } | null {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  for (const genus of GENERA) {
    const filePath = path.join(plantsRoot, genus, `${slug}.json`);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Strip cultivar names and hybrid markers, returning genus + species only.
// Returns null when only a genus-level name can be extracted — in that case
// we should not query iNaturalist as it would return unrelated species photos.
// "Anthurium crystallinum 'Variegated'" → "Anthurium crystallinum" (valid)
// "Philodendron 'Belle Isle'"           → null (genus-only, skip)
// "Monstera × albo"                     → "Monstera albo" (valid if 2 words)
function extractTaxonName(scientificName: string): string | null {
  const cleaned = scientificName
    .replace(/'[^']*'/g, "")   // remove cultivar names in single quotes
    .replace(/×\s*/g, "")      // remove hybrid × markers
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) return null; // genus-only — not specific enough
  return words.slice(0, 2).join(" ");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const plant = findPlantData(slug);
  if (!plant) {
    return NextResponse.json({ photos: [] }, { status: 404 });
  }

  const taxonName = extractTaxonName(plant.scientificName);

  // Cultivar-only or genus-only plants have no iNaturalist observations worth showing.
  if (!taxonName) {
    return NextResponse.json({ photos: [], taxonName: plant.scientificName });
  }

  const url = new URL("https://api.inaturalist.org/v1/observations");
  url.searchParams.set("taxon_name", taxonName);
  url.searchParams.set("quality_grade", "research");
  url.searchParams.set("photos", "true");
  url.searchParams.set("per_page", "20");
  url.searchParams.set("order_by", "votes");
  url.searchParams.set("photo_license", "any");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "AroidAtlas/1.0 (aroidatlas.com)" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json({ photos: [], taxonName });
    }

    const data = await res.json();
    const photos: {
      url: string;
      attribution: string;
      observationUrl: string;
      location: string | null;
    }[] = [];

    for (const obs of data.results ?? []) {
      for (const photo of obs.photos ?? []) {
        if (photos.length >= 12) break;
        // iNaturalist photo URLs use "square" size — replace with "medium" (500px)
        const photoUrl = (photo.url as string | undefined)?.replace(/\/square\b/, "/medium");
        if (!photoUrl) continue;
        photos.push({
          url: photoUrl,
          attribution: (photo.attribution as string | undefined) ?? "",
          observationUrl: `https://www.inaturalist.org/observations/${obs.id}`,
          location: (obs.place_guess as string | null) ?? null,
        });
      }
      if (photos.length >= 12) break;
    }

    return NextResponse.json({ photos, taxonName });
  } catch {
    return NextResponse.json({ photos: [], taxonName });
  }
}
