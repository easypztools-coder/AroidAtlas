import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { collections } from "@/lib/mock-data";

const BASE_URL = "https://aroidatlas.com";

function fileMtime(filePath: string): Date {
  try {
    return fs.statSync(filePath).mtime;
  } catch {
    return new Date();
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const plantsRoot = path.join(process.cwd(), "content", "plants");

  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/plants`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/learn`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/identify`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...collections.map((c) => ({
      url: `${BASE_URL}/collections/${c.slug}`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];

  if (!fs.existsSync(plantsRoot)) return routes;

  const genera = fs.readdirSync(plantsRoot).filter((f) =>
    fs.statSync(path.join(plantsRoot, f)).isDirectory()
  );

  for (const genus of genera) {
    routes.push({
      url: `${BASE_URL}/plants/${genus}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    const dirPath = path.join(plantsRoot, genus);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const slug = file.replace(".json", "");
      let hasPriceData = false;
      try {
        const plantJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        hasPriceData = plantJson?.marketMetrics?.currentMedianPriceGBP != null;
      } catch {
        // leave hasPriceData false
      }
      routes.push({
        url: `${BASE_URL}/plants/${genus}/${slug}`,
        lastModified: fileMtime(filePath),
        changeFrequency: "weekly",
        priority: hasPriceData ? 0.9 : 0.7,
      });
    }
  }

  return routes;
}
