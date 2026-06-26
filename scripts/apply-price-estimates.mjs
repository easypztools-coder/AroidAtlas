/**
 * Applies pre-computed AI price estimates directly to plant JSON files.
 * No API calls needed — prices are derived from UK market knowledge.
 * Run with: node scripts/apply-price-estimates.mjs [--dry-run]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const isDryRun = process.argv.includes("--dry-run");

// UK market price estimates (GBP) for mid-sized collector specimens, 2026
// Keys can be "slug" or "genus/slug" for disambiguation when slugs collide across genera
const PRICE_ESTIMATES = {
  // ── Alocasia ─────────────────────────────────────────────────────────────
  "azlanii-variegated":                          150,
  "baginda-dragon-scale-albo-variegated":        180,
  "chaii":                                        95,
  "cuprea-pink-variegata":                       450,
  "infernalis":                                   90,
  "loco":                                        120,
  "longiloba-watsoniana-pink-doff-variegated":   200,
  "melo":                                         85,
  "micholitziana-frydek-mint-variegated":        500,
  "nebula-variegated":                           160,
  "princeps":                                     90,
  "reginula-black-velvet-pink-albo-variegata":   650,
  "reversa":                                      90,
  "scalprum":                                    100,
  "sinuata":                                      95,
  "sp":                                           95,
  "venom":                                       120,
  "zebrina":                                      35,

  // ── Anthurium ────────────────────────────────────────────────────────────
  "ace-of-spades-variegata":                     400,
  "ace-of-spades":                               110,
  "besseae":                                     350,
  "carlablackiae":                               700,
  "corrugatum":                                   90,
  "crystallinum-variegated":                     150,
  "crystallinum":                                 85,
  "cutucuense":                                  400,
  "dressleri-variegated":                        180,
  "faustomirandae":                              800,
  "forgetii-variegated":                         180,
  "forgetii-x-crystallinum":                     100,
  "luxurians-variegata":                         900,
  "luxurians-x-forgetii":                        120,
  "luxurians-x-radicans":                        120,
  "anthurium/luxurians":                         500,
  "magnificum-variegated":                       180,
  "magnificum-x-crystallinum":                   100,
  "magnificum":                                   90,
  "metallicum":                                  350,
  "pallidiflorum":                                90,
  "papillilaminum-variegata":                    750,
  "papillilaminum-x-magnificum":                 100,
  "papillilaminum":                              450,
  "pedatoradiatum":                               45,
  "peltigerum":                                  120,
  "pendens":                                      90,
  "pendulifolium":                               100,
  "polyschistum":                                110,
  "regale-variegated":                           200,
  "regale":                                      450,
  "rugulosum":                                   130,
  "splendidum":                                  400,
  "superbum":                                     95,
  "veitchii-variegated":                         800,
  "villenaorum":                                 900,
  "vittariifolium-variegated":                   150,
  "vittariifolium":                               65,
  "warocqueanum-variegated":                     850,
  "warocqueanum":                                200,
  "wendlingeri":                                 100,

  // ── Begonia ──────────────────────────────────────────────────────────────
  "acetosa":                                      25,
  "aconitifolia-variegated":                      30,
  "amphioxus":                                   350,
  "bipinnatifida":                               120,
  "bogneri":                                      45,
  "brevirimosa":                                  90,
  "chlorosticta":                                400,
  "darthvaderiana":                              350,
  "dregei":                                       20,
  "ferox":                                       450,
  "listada":                                      20,
  "begonia/luxurians":                            25,
  "maculata-albo-variegated":                     95,
  "malachosticta":                               100,
  "masoniana-variegated":                         90,
  "melanobullata":                               380,
  "ningmingensis":                                85,
  "pavonina":                                     90,
  "rajah":                                        90,
  "rex-cultorum-escargot":                        20,
  "serratipetala":                                20,
  "sizemoreae":                                   95,
  "soli-mutata":                                  90,
  "venosa":                                       25,

  // ── Monstera ─────────────────────────────────────────────────────────────
  "acacoyaguensis":                              100,
  "adansonii":                                    15,
  "burle-marx-flame":                            120,
  "croatii":                                      95,
  "deliciosa-mint":                              500,
  "deliciosa":                                    12,
  "devil-monster":                               110,
  "dissecta":                                     90,
  "dubia-variegated":                            180,
  "dubia":                                        65,
  "lechleriana-albo-variegated":                 150,
  "lechleriana":                                  55,
  "obliqua-peru-form":                           800,
  "pinnatipartita-albo-variegated":              150,
  "punctulata":                                   90,
  "siltepecana-el-salvador":                      45,
  "spruceana":                                    90,
  "standleyana-aurea-variegated":                 65,
  "subpinnata":                                   45,
  "tuberculata":                                  95,
  "vasquezii":                                    90,

  // ── Other genera ─────────────────────────────────────────────────────────
  "amydrium-hainanense":                          90,
  "amydrium-humile":                              90,
  "amydrium-medium":                              90,
  "amydrium-sinense":                             90,
  "amydrium-zippelianum":                         90,
  "cercestis-mirabilis":                          85,
  "epipremnum-amplissimum":                       85,
  "epipremnum-giganteum":                         90,
  "epipremnum-pinnatum-cebu-blue":                40,
  "epipremnum-snow-leopard":                     110,
  "pothos-barberianus":                           90,
  "rhaphidophora-beccarii":                       35,
  "rhaphidophora-cryptantha-variegated":         150,
  "rhaphidophora-cryptantha":                     35,
  "rhaphidophora-decursiva":                      90,
  "rhaphidophora-foraminifera":                   95,
  "rhaphidophora-hayi":                           35,
  "rhaphidophora-korthalsii":                     90,
  "rhaphidophora-latevaginata":                   90,
  "rhaphidophora-megasperma":                     90,
  "rhaphidophora-tetrasperma":                    40,
  "scindapsus-lucens":                            90,
  "scindapsus-officinalis":                       90,
  "scindapsus-silver-hero":                      110,
  "scindapsus-treubii-moonlight-variegated":     150,
  "scindapsus-treubii":                           45,

  // ── Philodendron ─────────────────────────────────────────────────────────
  "atabapoense-variegated":                      130,
  "belle-isle":                                  110,
  "billietiae-variegated":                       200,
  "billietiae":                                   90,
  "camposportoanum-variegated":                  130,
  "caramel-marble":                              600,
  "dean-mcdowell":                               110,
  "distantilobum":                                90,
  "fragrantissimum":                              90,
  "gloriosum-tricolor":                          150,
  "hastatum":                                     35,
  "ilsemannii-variegated":                       450,
  "joepii-aurea-variegata":                      800,
  "joepii":                                      450,
  "lacerum":                                      90,
  "lupinum-variegated":                          130,
  "majestic":                                    110,
  "melanochrysum-variegated":                    150,
  "mexicanum-variegated":                        130,
  "nangaritense-variegated":                     130,
  "pastazanum":                                   55,
  "patriciae-variegata":                         900,
  "patriciae":                                   450,
  "red-anderson":                                100,
  "rugosum":                                      90,
  "serpens":                                      90,
  "sodiroi-variegated":                          130,
  "sodiroi":                                      35,
  "splendid":                                    100,
  "spiritus-sancti":                              50,
  "squamiferum-mint-variegated":                 150,
  "stenolobum":                                   90,
  "tenue":                                        90,
  "tortum-aurea-variegated":                     400,
  "tortum":                                       90,
  "tripartitum":                                  90,
  "verrucosum-variegated":                       150,
  "whipple-way":                                 450,
};

function walk(dir) {
  const entries = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) entries.push(...walk(full));
    else if (f.endsWith(".json")) entries.push(full);
  }
  return entries;
}

const plantsRoot = path.join(projectRoot, "content", "plants");
const files = walk(plantsRoot);

let updated = 0;
let skipped = 0;
let alreadyHas = 0;
let notInMap = 0;

for (const filePath of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    continue;
  }

  if (!data.priceTracking?.enabled) continue;

  const slug = data.slug;

  // Skip plants that already have a real price
  if (data.marketMetrics?.currentMedianPriceGBP && data.marketMetrics?.estimatedSource !== "ai_estimate") {
    alreadyHas++;
    continue;
  }

  // Skip plants that already have an AI estimate
  if (data.marketMetrics?.currentMedianPriceGBP && data.marketMetrics?.estimatedSource === "ai_estimate") {
    alreadyHas++;
    continue;
  }

  const genus = (data.genus || "").toLowerCase();
  const price = PRICE_ESTIMATES[`${genus}/${slug}`] ?? PRICE_ESTIMATES[slug];
  if (!price) {
    console.log(`  ⚠  No estimate for slug: ${slug}`);
    notInMap++;
    continue;
  }

  console.log(`  ${isDryRun ? "[DRY] " : ""}${slug}: £${price}`);

  if (!isDryRun) {
    data.marketMetrics = {
      ...(data.marketMetrics ?? {}),
      currentMedianPriceGBP: price,
      marketStatus: data.marketMetrics?.marketStatus ?? null,
      threeMonthChangePercent: data.marketMetrics?.threeMonthChangePercent ?? null,
      estimatedSource: "ai_estimate",
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    updated++;
  } else {
    skipped++;
  }
}

console.log(`\nDone. Updated: ${updated}, Dry-run skipped: ${skipped}, Already had price: ${alreadyHas}, No estimate in map: ${notInMap}`);
