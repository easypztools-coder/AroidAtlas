import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface SearchPlant {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  genus: string;
  rarityStatus: string;
  priceGuideTier: string;
  botanicalType: string;
}

export async function GET() {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  const results: SearchPlant[] = [];

  if (fs.existsSync(plantsRoot)) {
    const genera = fs.readdirSync(plantsRoot).filter((f) => {
      return fs.statSync(path.join(plantsRoot, f)).isDirectory();
    });

    for (const genus of genera) {
      const genusDir = path.join(plantsRoot, genus);
      const files = fs.readdirSync(genusDir).filter((f) => f.endsWith(".json"));

      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(genusDir, file), "utf-8");
          const data = JSON.parse(raw);
          results.push({
            slug: data.slug,
            name: data.name,
            scientificName: data.scientificName,
            commonName: data.commonName,
            genus: data.genus || genus,
            rarityStatus: data.rarityStatus,
            priceGuideTier: data.priceGuideTier,
            botanicalType: data.botanicalType || "variegated",
          });
        } catch (err) {
          console.error(`Error reading plant file for API: ${file}`, err);
        }
      }
    }
  }

  return NextResponse.json(results);
}
