import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { collections } from "@/lib/mock-data";

const BASE_URL = "https://aroidatlas.co.uk";

function fileMtime(filePath: string): Date {
  try {
    return fs.statSync(filePath).mtime;
  } catch {
    return new Date();
  }
}

/**
 * Real eBay sale data lives in deploy-time snapshots under content/price-snapshots/<slug>/,
 * not in the plant JSON's embedded `priceHistory` (which is a stale AI-estimate fallback
 * for the handful of plants without a snapshot yet). Mirrors the sample-size lookup used
 * on /radar.
 */
function hasRealSnapshotData(slug: string): boolean {
  const dirPath = path.join(process.cwd(), "content", "price-snapshots", slug);
  if (!fs.existsSync(dirPath)) return false;
  try {
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
    if (files.length === 0) return false;
    const latestFile = files.sort()[files.length - 1];
    const raw = fs.readFileSync(path.join(dirPath, latestFile), "utf-8");
    const parsed = JSON.parse(raw);
    const sampleSize = parsed.stats?.sampleSize ?? parsed.snapshot?.acceptedCount ?? parsed.acceptedCount ?? 0;
    return sampleSize > 0;
  } catch {
    return false;
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
      url: `${BASE_URL}/catalog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/radar`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
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
    ...[
      "stem-cutting",
      "node-cutting",
      "leaf-cutting",
      "rhizome-division",
      "offsets-and-pups",
      "air-layering",
      "seed-propagation",
    ].map((method) => ({
      url: `${BASE_URL}/guides/propagation/${method}`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
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
      const hasPriceData = hasRealSnapshotData(slug);
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
