import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const BASE_URL = "https://ariodatlas.com"; // TODO: update with real domain before going live
const GENERA = ["monstera", "philodendron", "alocasia", "anthurium", "other"];


export default function sitemap(): MetadataRoute.Sitemap {
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
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/identify`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/learn`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  for (const genus of GENERA) {
    routes.push({
      url: `${BASE_URL}/plants/${genus}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    const dirPath = path.join(process.cwd(), "content", "plants", genus);
    if (!fs.existsSync(dirPath)) continue;

    const slugs = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));

    for (const slug of slugs) {
      routes.push({
        url: `${BASE_URL}/plants/${genus}/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return routes;
}
