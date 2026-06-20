/**
 * CLI tool: npx tsx scripts/audit-links.ts
 *
 * Scans the codebase for static and dynamic link paths, verifies they resolve to
 * valid Next.js route endpoints or plant database pages, and audits all plant-to-plant
 * recommendations inside content/plants/ to ensure no dead links exist.
 */

import fs from "fs";
import path from "path";

const contentPlantsRoot = path.join(process.cwd(), "content", "plants");
const srcRoot = path.join(process.cwd(), "src");

// Static route validation map
const VALID_STATIC_ROUTES = new Set([
  "/",
  "/plants",
  "/compare",
  "/identify",
  "/learn",
  "/about",
  "/privacy",
  "/terms",
]);

const VALID_GENERA = new Set(["alocasia", "anthurium", "monstera", "philodendron", "rhaphidophora", "scindapsus"]);

// Simple recursive directory scanner
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

// Check if a generated path is theoretically valid on our website
function validateInternalPath(targetPath: string): { valid: boolean; reason?: string } {
  // Strip query parameters or hashes
  const cleanPath = targetPath.split("?")[0].split("#")[0];

  // 1. Check if it is a valid static route
  if (VALID_STATIC_ROUTES.has(cleanPath)) {
    return { valid: true };
  }

  // 2. Check if it is a genus page (e.g. /plants/monstera)
  const genusMatch = cleanPath.match(/^\/plants\/([a-zA-Z0-9_-]+)$/);
  if (genusMatch) {
    const genus = genusMatch[1].toLowerCase();
    if (VALID_GENERA.has(genus)) {
      return { valid: true };
    }
    return { valid: false, reason: `Invalid genus: "${genus}"` };
  }

  // 3. Check if it is a plant detail page (e.g. /plants/monstera/devil-monster)
  const detailMatch = cleanPath.match(/^\/plants\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/);
  if (detailMatch) {
    const genus = detailMatch[1].toLowerCase();
    const slug = detailMatch[2].toLowerCase();

    if (!VALID_GENERA.has(genus)) {
      return { valid: false, reason: `Invalid genus in detail path: "${genus}"` };
    }

    const jsonPath = path.join(contentPlantsRoot, genus, `${slug}.json`);
    if (fs.existsSync(jsonPath)) {
      return { valid: true };
    }
    return { valid: false, reason: `Plant database profile does not exist at content/plants/${genus}/${slug}.json` };
  }

  // Ignore dynamic interpolation targets like /plants/${genus}/${slug}
  if (cleanPath.includes("${") || cleanPath.includes("`") || cleanPath.includes("plant.")) {
    return { valid: true }; // skipped dynamic
  }

  return { valid: false, reason: `Unknown route path structure: "${cleanPath}"` };
}

async function runAudit() {
  console.log("=".repeat(60));
  console.log("  WEBSITE LINK AUDIT & SITE HEALTH CHECK");
  console.log("=".repeat(60));

  let issuesFound = 0;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. AUDIT PLANT DATABASE RECOMMENDATIONS (.json files)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\nAuditing Plant Database Recommendations (.json files)...");
  
  if (!fs.existsSync(contentPlantsRoot)) {
    console.error(`Error: content/plants root directory not found at ${contentPlantsRoot}`);
    process.exit(1);
  }

  const genusDirs = fs.readdirSync(contentPlantsRoot).filter((f) => {
    return fs.statSync(path.join(contentPlantsRoot, f)).isDirectory();
  });

  for (const genus of genusDirs) {
    const genusPath = path.join(contentPlantsRoot, genus);
    const jsonFiles = fs.readdirSync(genusPath).filter((f) => f.endsWith(".json"));

    for (const file of jsonFiles) {
      const filePath = path.join(genusPath, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      let data: any;

      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error(`[x] Syntax Error: Failed to parse JSON file at content/plants/${genus}/${file}`);
        issuesFound++;
        continue;
      }

      const recommended = data.recommendedPlants || [];
      for (const rec of recommended) {
        const recSlug = rec.slug;
        // Infer genus if not explicitly declared in recommended item (uses first word of name)
        const recGenus = (rec.genus || rec.name.split(" ")[0].replace(/['"]/g, "")).toLowerCase();

        if (!VALID_GENERA.has(recGenus)) {
          console.error(`[x] Invalid Recommendation: "${data.name}" (content/plants/${genus}/${file}) recommends "${rec.name}" but inferred genus "${recGenus}" is invalid.`);
          issuesFound++;
          continue;
        }

        const targetJson = path.join(contentPlantsRoot, recGenus, `${recSlug}.json`);
        if (!fs.existsSync(targetJson)) {
          console.error(`[x] Dead Link Recommendation: "${data.name}" (content/plants/${genus}/${file}) recommends "${rec.name}" (slug: "${recSlug}") but target page does not exist at content/plants/${recGenus}/${recSlug}.json`);
          issuesFound++;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. AUDIT CODEBASE COMPONENTS FOR STATIC ROUTE ERROR
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\nAuditing Source Code Links (<Link href=...>)...");
  
  const sourceFiles = scanDir(srcRoot).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
  const linkRegex = /href=["'](\/[^"']*)["']/g;

  for (const file of sourceFiles) {
    const relativeFilePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, "utf-8");
    let match;

    // Reset regex index
    linkRegex.lastIndex = 0;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkTarget = match[1];
      
      // Skip asset folders
      if (linkTarget.startsWith("/images/") || linkTarget.startsWith("/fonts/") || linkTarget.startsWith("/api/")) {
        continue;
      }

      const check = validateInternalPath(linkTarget);
      if (!check.valid) {
        console.error(`[x] Dead Link in Code: ${relativeFilePath} references "${linkTarget}". Reason: ${check.reason}`);
        issuesFound++;
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. FINAL DIAGNOSTIC
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  if (issuesFound === 0) {
    console.log("  ✓ SUCCESS: No dead links or invalid recommendation mappings found.");
    console.log("  Site health check completed successfully.");
  } else {
    console.error(`  ✗ FAILURE: Found ${issuesFound} linking issues in the site.`);
  }
  console.log("=".repeat(60) + "\n");

  process.exit(issuesFound === 0 ? 0 : 1);
}

runAudit().catch((err) => {
  console.error("Fatal error during link audit:", err);
  process.exit(1);
});
