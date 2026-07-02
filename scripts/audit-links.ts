/**
 * CLI tool: npx tsx scripts/audit-links.ts
 *
 * Scans the codebase for static and dynamic link paths, verifies they resolve to
 * valid Next.js route endpoints or plant database pages, audits all plant-to-plant
 * recommendations inside content/plants/ to ensure no dead links exist, and checks
 * that every "plate" tier plant has a matching botanical plate PNG (and no orphan
 * PNGs exist with no JSON page).
 *
 * Genus folders and valid plant slugs are discovered by scanning content/plants/
 * at run time rather than hardcoded, so this stays correct as genera/plants are added.
 */

import fs from "fs";
import path from "path";

const contentPlantsRoot = path.join(process.cwd(), "content", "plants");
const publicPlantsRoot = path.join(process.cwd(), "public", "plants");
const srcRoot = path.join(process.cwd(), "src");

// Static route validation map — every route under src/app that isn't dynamic
const VALID_STATIC_ROUTES = new Set([
  "/",
  "/plants",
  "/catalog",
  "/compare",
  "/identify",
  "/learn",
  "/about",
  "/privacy",
  "/terms",
  "/radar",
  "/price-index",
]);

// Dynamic route prefixes that aren't backed by content/plants/ (skip existence check)
const VALID_DYNAMIC_PREFIXES = [/^\/collections\/[a-z0-9-]+$/, /^\/guides\/propagation\/[a-z0-9-]+$/];

function scanDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDir(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function getGenusFolders(): string[] {
  if (!fs.existsSync(contentPlantsRoot)) return [];
  return fs.readdirSync(contentPlantsRoot).filter((f) => fs.statSync(path.join(contentPlantsRoot, f)).isDirectory());
}

interface PlantRecord {
  genusFolder: string;
  slug: string;
  filename: string;
  contentTier: "plate" | "sketch";
}

// Build an index of every real plant keyed by slug -> plant record(s).
// Slugs are checked by actual location on disk, not by guessing genus from a display name.
function buildPlantIndex(genusFolders: string[]): Map<string, PlantRecord[]> {
  const index = new Map<string, PlantRecord[]>();
  for (const genusFolder of genusFolders) {
    const dirPath = path.join(contentPlantsRoot, genusFolder);
    const jsonFiles = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
    for (const file of jsonFiles) {
      const raw = fs.readFileSync(path.join(dirPath, file), "utf-8");
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        continue; // reported separately below
      }
      const slug = data.slug || file.replace(".json", "");
      const record: PlantRecord = {
        genusFolder,
        slug,
        filename: file,
        contentTier: data.contentTier === "sketch" ? "sketch" : "plate",
      };
      const existing = index.get(slug) ?? [];
      existing.push(record);
      index.set(slug, existing);
    }
  }
  return index;
}

function validateInternalPath(targetPath: string, genusFolders: Set<string>, plantIndex: Map<string, PlantRecord[]>): { valid: boolean; reason?: string } {
  const cleanPath = targetPath.split("?")[0].split("#")[0];

  if (VALID_STATIC_ROUTES.has(cleanPath)) {
    return { valid: true };
  }

  if (VALID_DYNAMIC_PREFIXES.some((re) => re.test(cleanPath))) {
    return { valid: true };
  }

  const genusMatch = cleanPath.match(/^\/plants\/([a-zA-Z0-9_-]+)$/);
  if (genusMatch) {
    const genus = genusMatch[1].toLowerCase();
    if (genusFolders.has(genus)) {
      return { valid: true };
    }
    return { valid: false, reason: `Invalid genus folder: "${genus}"` };
  }

  const detailMatch = cleanPath.match(/^\/plants\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/);
  if (detailMatch) {
    const genus = detailMatch[1].toLowerCase();
    const slug = detailMatch[2].toLowerCase();

    if (!genusFolders.has(genus)) {
      return { valid: false, reason: `Invalid genus folder in detail path: "${genus}"` };
    }

    const jsonPath = path.join(contentPlantsRoot, genus, `${slug}.json`);
    if (fs.existsSync(jsonPath)) {
      return { valid: true };
    }
    return { valid: false, reason: `Plant database profile does not exist at content/plants/${genus}/${slug}.json` };
  }

  // Ignore dynamic interpolation targets like /plants/${genus}/${slug}
  if (cleanPath.includes("${") || cleanPath.includes("`") || cleanPath.includes("plant.")) {
    return { valid: true };
  }

  return { valid: false, reason: `Unknown route path structure: "${cleanPath}"` };
}

async function runAudit() {
  console.log("=".repeat(60));
  console.log("  WEBSITE LINK & PLATE AUDIT / SITE HEALTH CHECK");
  console.log("=".repeat(60));

  let issuesFound = 0;

  if (!fs.existsSync(contentPlantsRoot)) {
    console.error(`Error: content/plants root directory not found at ${contentPlantsRoot}`);
    process.exit(1);
  }

  const genusFolderList = getGenusFolders();
  const genusFolders = new Set(genusFolderList);
  console.log(`\nDiscovered genus folders: ${genusFolderList.join(", ")}`);

  const plantIndex = buildPlantIndex(genusFolderList);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. AUDIT PLANT DATABASE RECOMMENDATIONS (.json files)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\nAuditing Plant Database Recommendations (.json files)...");

  for (const genusFolder of genusFolderList) {
    const genusPath = path.join(contentPlantsRoot, genusFolder);
    const jsonFiles = fs.readdirSync(genusPath).filter((f) => f.endsWith(".json"));

    for (const file of jsonFiles) {
      const filePath = path.join(genusPath, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      let data: any;

      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error(`[x] Syntax Error: Failed to parse JSON file at content/plants/${genusFolder}/${file}`);
        issuesFound++;
        continue;
      }

      // slug field should match its own filename — otherwise generateStaticParams()
      // (which uses the filename) and content lookups (which use data.slug) can diverge.
      const expectedSlug = file.replace(".json", "");
      if (data.slug && data.slug !== expectedSlug) {
        console.error(`[x] Slug Mismatch: content/plants/${genusFolder}/${file} has "slug": "${data.slug}" but filename implies "${expectedSlug}".`);
        issuesFound++;
      }

      const recommended = data.recommendedPlants || [];
      for (const rec of recommended) {
        const recSlug = rec.slug;
        const candidates = plantIndex.get(recSlug);

        if (!candidates || candidates.length === 0) {
          console.error(`[x] Dead Link Recommendation: "${data.name}" (content/plants/${genusFolder}/${file}) recommends "${rec.name}" (slug: "${recSlug}") but no plant page exists with that slug anywhere in content/plants/.`);
          issuesFound++;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. AUDIT PLATE IMAGE / JSON PARITY (content/plants/ vs public/plants/)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\nAuditing Plate Image / JSON Parity (public/plants/ vs content/plants/)...");

  for (const [slug, records] of Array.from(plantIndex.entries())) {
    for (const record of records) {
      if (record.contentTier !== "plate") continue; // sketch tier intentionally has no PNG
      const pngPath = path.join(publicPlantsRoot, record.genusFolder, `${slug}.png`);
      if (!fs.existsSync(pngPath)) {
        console.error(`[x] Missing Plate Image: content/plants/${record.genusFolder}/${record.filename} is "plate" tier but public/plants/${record.genusFolder}/${slug}.png does not exist.`);
        issuesFound++;
      }
    }
  }

  if (fs.existsSync(publicPlantsRoot)) {
    const publicGenusFolders = fs.readdirSync(publicPlantsRoot).filter((f) => fs.statSync(path.join(publicPlantsRoot, f)).isDirectory());
    for (const genusFolder of publicGenusFolders) {
      if (!genusFolders.has(genusFolder)) {
        console.error(`[x] Orphan Genus Folder: public/plants/${genusFolder}/ exists but content/plants/${genusFolder}/ does not.`);
        issuesFound++;
      }
      const pngFiles = fs.readdirSync(path.join(publicPlantsRoot, genusFolder)).filter((f) => f.endsWith(".png"));
      for (const pngFile of pngFiles) {
        const slug = pngFile.replace(".png", "");
        const jsonPath = path.join(contentPlantsRoot, genusFolder, `${slug}.json`);
        if (!fs.existsSync(jsonPath)) {
          console.error(`[x] Orphan Plate Image: public/plants/${genusFolder}/${pngFile} has no matching content/plants/${genusFolder}/${slug}.json.`);
          issuesFound++;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. AUDIT CODEBASE COMPONENTS FOR STATIC ROUTE ERRORS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\nAuditing Source Code Links (<Link href=...>)...");

  const sourceFiles = scanDir(srcRoot).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
  const linkRegex = /href=["'](\/[^"']*)["']/g;

  for (const file of sourceFiles) {
    const relativeFilePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, "utf-8");
    let match;

    linkRegex.lastIndex = 0;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkTarget = match[1];

      if (linkTarget.startsWith("/images/") || linkTarget.startsWith("/fonts/") || linkTarget.startsWith("/api/")) {
        continue;
      }

      const check = validateInternalPath(linkTarget, genusFolders, plantIndex);
      if (!check.valid) {
        console.error(`[x] Dead Link in Code: ${relativeFilePath} references "${linkTarget}". Reason: ${check.reason}`);
        issuesFound++;
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. FINAL DIAGNOSTIC
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  if (issuesFound === 0) {
    console.log("  ✓ SUCCESS: No dead links, orphan plates, or invalid recommendation mappings found.");
    console.log("  Site health check completed successfully.");
  } else {
    console.error(`  ✗ FAILURE: Found ${issuesFound} linking/plate issues in the site.`);
  }
  console.log("=".repeat(60) + "\n");

  process.exit(issuesFound === 0 ? 0 : 1);
}

runAudit().catch((err) => {
  console.error("Fatal error during link audit:", err);
  process.exit(1);
});
