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

// Strip cultivar names (anything in quotes or after the 2nd word)
// "Anthurium crystallinum 'Variegated'" → "Anthurium crystallinum"
function extractTaxonName(scientificName: string): string {
  const cleaned = scientificName.replace(/'[^']*'/g, "").trim();
  const words = cleaned.split(/\s+/);
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
