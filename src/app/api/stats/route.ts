import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  const snapshotsRoot = path.join(process.cwd(), "content", "price-snapshots");

  let species = 0;
  let generaCount = 0;
  let soldCompsAnalysed = 0;
  let priceChecks = 0;

  if (fs.existsSync(plantsRoot)) {
    const generaDirs = fs.readdirSync(plantsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    for (const genusDir of generaDirs) {
      const files = fs.readdirSync(path.join(plantsRoot, genusDir.name))
        .filter((f) => f.endsWith(".json"));
      if (files.length > 0) {
        generaCount++;
        species += files.length;
      }
    }
  }

  if (fs.existsSync(snapshotsRoot)) {
    const slugDirs = fs.readdirSync(snapshotsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    for (const slugDir of slugDirs) {
      const slugPath = path.join(snapshotsRoot, slugDir.name);
      const allFiles = fs.readdirSync(slugPath).filter((f) => f.endsWith(".json"));
      priceChecks += allFiles.length;

      const latestPath = path.join(slugPath, "latest.json");
      if (fs.existsSync(latestPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
          soldCompsAnalysed += data.acceptedCount ?? 0;
        } catch {
          // malformed snapshot — skip
        }
      }
    }
  }

  return NextResponse.json({ species, genera: generaCount, soldCompsAnalysed, priceChecks });
}
