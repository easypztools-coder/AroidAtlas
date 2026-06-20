import fs from "fs";
import path from "path";

const contentPlantsRoot = path.join(process.cwd(), "content", "plants");

function getBotanicalType(slug: string, scientificName: string, name: string, statusTag: string): string {
  const lowerSlug = slug.toLowerCase();
  const lowerName = name.toLowerCase();
  const lowerSciName = scientificName.toLowerCase();
  const lowerStatus = (statusTag || "").toLowerCase();

  // Mutations
  if (lowerSlug === "venom" || lowerSlug === "devil-monster") {
    return "mutation";
  }

  // Hybrids
  if (
    lowerSlug === "delta-force" ||
    lowerName.includes(" × ") ||
    lowerName.includes(" x ") ||
    lowerSciName.includes(" × ") ||
    lowerSciName.includes(" x ") ||
    lowerStatus.includes("hybrid")
  ) {
    return "hybrid";
  }

  // Cultivars (non-variegated cultivars/selections)
  if (
    lowerSlug === "burle-marx-flame" ||
    lowerSlug === "siltepecana-el-salvador"
  ) {
    return "cultivar";
  }

  // Wild Species
  if (
    lowerSlug === "spiritus-sancti" ||
    lowerSlug === "obliqua-peru-form" ||
    lowerSlug === "sp" ||
    lowerStatus.includes("species")
  ) {
    return "species";
  }

  // Variegated (default fallback, as most of the database are variegated forms)
  return "variegated";
}

function migrate() {
  console.log("Starting botanicalType migration...");
  if (!fs.existsSync(contentPlantsRoot)) {
    console.error(`Root folder not found: ${contentPlantsRoot}`);
    return;
  }

  const genera = fs.readdirSync(contentPlantsRoot).filter((f) => {
    return fs.statSync(path.join(contentPlantsRoot, f)).isDirectory();
  });

  let migratedCount = 0;
  let skippedCount = 0;

  for (const genus of genera) {
    const genusDir = path.join(contentPlantsRoot, genus);
    const files = fs.readdirSync(genusDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(genusDir, file);
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(raw);

        const calculatedType = getBotanicalType(
          data.slug || path.basename(file, ".json"),
          data.scientificName || "",
          data.name || "",
          data.statusTag || ""
        );

        // Update botanicalType
        data.botanicalType = calculatedType;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
        console.log(`[Migrated] ${genus}/${file} -> ${calculatedType}`);
        migratedCount++;
      } catch (err) {
        console.error(`[Error] Failed to process ${genus}/${file}:`, err);
      }
    }
  }

  console.log(`\nMigration completed successfully.`);
  console.log(`Migrated files: ${migratedCount}`);
}

migrate();
