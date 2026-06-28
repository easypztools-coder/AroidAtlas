import fs from "fs";
import path from "path";

const sourceDir = path.join(process.cwd(), "Finished Plates");
const contentPlantsRoot = path.join(process.cwd(), "content", "plants");

const SKIPPED_FILES = new Set([
  "Anthurium 'Delta Force'.png",
  "Monstera 'Burle Marx Flame'.png",
  "Monstera 'Devil Monster'.png",
  "Spiritus Sancti.png",
  "Philodendron spiritus-sancti.png",
  "Philodendron 'Caramel Marble' (1).png",
  "Monstera pinnatipartita (1).png",
]);

function getGenusFromFilename(filename) {
  const lower = filename.toLowerCase();
  if (lower.startsWith("alocasia")) return "alocasia";
  if (lower.startsWith("anthurium")) return "anthurium";
  if (lower.startsWith("monstera")) return "monstera";
  if (lower.startsWith("philodendron")) return "philodendron";
  if (lower.startsWith("begonia")) return "begonia";
  return "other";
}

function getSlugCandidateFromFilename(filename, genus) {
  let base = path.basename(filename, path.extname(filename));
  if (base.toLowerCase().startsWith(genus.toLowerCase())) {
    base = base.substring(genus.length).trim();
  }
  if (base.startsWith("x ") || base.startsWith("× ")) {
    base = base.substring(2).trim();
  }
  let slug = base.toLowerCase()
    .replace(/['"()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  
  // Map variegata to variegated
  slug = slug.replace(/variegata/g, "variegated");
  
  if (slug === "ilsemanii-variegated") return "ilsemannii-variegated";
  return slug;
}

const files = fs.readdirSync(sourceDir).filter((file) => {
  const ext = path.extname(file).toLowerCase();
  return (ext === ".png" || ext === ".jpg" || ext === ".jpeg") && fs.statSync(path.join(sourceDir, file)).isFile();
});

console.log(`Total files in Finished Plates: ${files.length}`);

const missing = [];

for (const file of files) {
  if (SKIPPED_FILES.has(file)) continue;
  if (file.startsWith("ChatGPT Image")) continue;

  const genus = getGenusFromFilename(file);
  const slug = getSlugCandidateFromFilename(file, genus);
  
  const slugVariegated = slug.replace(/variegata/g, "variegated");
  const slugVariegata = slug.replace(/variegated/g, "variegata");
  
  const pathVariegated = path.join(contentPlantsRoot, genus, `${slugVariegated}.json`);
  const pathVariegata = path.join(contentPlantsRoot, genus, `${slugVariegata}.json`);

  if (!fs.existsSync(pathVariegated) && !fs.existsSync(pathVariegata)) {
    missing.push({ file, genus, slug });
  }
}

console.log(`Missing pages count: ${missing.length}`);
console.log("Missing pages:");
console.log(JSON.stringify(missing, null, 2));
