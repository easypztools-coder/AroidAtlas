/**
 * Applies price corrections to ai_estimate plants only.
 * Never touches "real" data (plants without estimatedSource: "ai_estimate").
 * Run with: node scripts/correct-price-estimates.mjs [--dry-run]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const isDryRun = process.argv.includes("--dry-run");

// Corrections to apply — only to plants with estimatedSource: "ai_estimate"
// Rationale abbreviated next to each
const CORRECTIONS = {
  // ── Anthurium: TC has dramatically lowered prices on mainstream species ───
  "warocqueanum":               95,   // TC flooded market, was £500+, now widely available
  "crystallinum":               45,   // TC very available, commodity species
  "magnificum":                 60,   // More available, not as rare as it was
  "ace-of-spades":              75,   // TC coming through, more accessible
  "pallidiflorum":              65,   // Fairly accessible now
  "corrugatum":                 70,   // Moderate availability
  "pendens":                    70,
  "superbum":                   70,
  "wendlingeri":                75,
  "pendulifolium":              75,
  "polyschistum":               80,

  // ── Anthurium ££££: bubble deflated, revise down from peak prices ─────────
  // "luxurians" is ambiguous (anthurium + begonia) — use genus/slug keys below
  "regale":                    280,   // More available via TC
  "papillilaminum":            280,   // TC coming through
  "besseae":                   180,   // More available than it was
  "metallicum":                180,   // Rarer than besseae but deflated
  "cutucuense":                220,   // Genuinely rare but not bubble pricing
  "splendidum":                220,   // Very rare but accessible via specialist sellers
  "carlablackiae":             380,   // Extremely rare, but bubble deflated
  "faustomirandae":            500,   // Genuinely ultra-rare, less deflation here
  "villenaorum":               400,   // Ultra rare but below bubble peak
  "luxurians-variegata":       600,   // Ultra rare, still commands premium
  "papillilaminum-variegata":  500,   // Ultra rare
  "veitchii-variegated":       550,   // Very rare variegated
  "warocqueanum-variegated":   550,   // Very rare variegated
  "ace-of-spades-variegata":   250,

  // ── Alocasia ─────────────────────────────────────────────────────────────
  "infernalis":                 60,   // Getting more available via TC
  "melo":                       60,   // More accessible
  "princeps":                   70,
  "reversa":                    70,
  "chaii":                      75,
  "sinuata":                    75,
  "scalprum":                   80,
  "reginula-black-velvet-pink-albo-variegata": 380,  // Genuinely ultra-rare
  "cuprea-pink-variegata":     300,
  "micholitziana-frydek-mint-variegated": 350,

  // ── Philodendron: TC available on many species now ───────────────────────
  "hastatum":                   18,   // Sold at garden centres, very common
  "sodiroi":                    28,   // More common
  "tortum":                     70,   // Getting more available
  "billietiae":                 70,   // More available
  "lacerum":                    70,
  "serpens":                    70,
  "tenue":                      70,
  "distantilobum":              70,
  "rugosum":                    70,
  "fragrantissimum":            70,
  "stenolobum":                 70,
  "tripartitum":                70,
  "pastazanum":                 40,   // More available now
  "patriciae":                 280,   // TC coming through
  "joepii":                    280,   // TC becoming available
  "ilsemannii-variegated":     300,
  "tortum-aurea-variegated":   280,
  "whipple-way":               300,
  "joepii-aurea-variegata":    550,   // Ultra rare
  "patriciae-variegata":       700,   // Ultra rare

  // ── Monstera ─────────────────────────────────────────────────────────────
  "deliciosa-mint":            320,   // TC now available, was £1000+ at peak
  "dissecta":                   70,
  "spruceana":                  70,
  "vasquezii":                  70,
  "tuberculata":                75,
  "punctulata":                 70,
  "acacoyaguensis":             75,
  "croatii":                    75,

  // ── Other genera ─────────────────────────────────────────────────────────
  "rhaphidophora-tetrasperma":  12,   // Ubiquitous, sold in supermarkets
  "rhaphidophora-decursiva":    65,
  "rhaphidophora-korthalsii":   65,
  "rhaphidophora-latevaginata": 65,
  "rhaphidophora-megasperma":   65,
  "rhaphidophora-foraminifera": 70,
  "scindapsus-treubii":         28,   // More available
  "scindapsus-lucens":          70,
  "scindapsus-officinalis":     70,
  "epipremnum-giganteum":       65,
  "epipremnum-amplissimum":     65,
  "pothos-barberianus":         70,
  "amydrium-medium":            70,
  "amydrium-humile":            70,
  "amydrium-sinense":           70,
  "amydrium-hainanense":        70,
  "amydrium-zippelianum":       70,
  "cercestis-mirabilis":        65,

  // ── Begonia ££££: collector market but not bubble pricing ─────────────────
  "ferox":                     280,
  "amphioxus":                 200,
  "chlorosticta":              260,
  "darthvaderiana":            200,
  "melanobullata":             220,

  // ── Disambiguation: genus/slug keys override plain slug when names collide ─
  "anthurium/luxurians":       280,
  // begonia/luxurians stays at £25 — no correction needed
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
let notInMap = 0;

for (const filePath of files) {
  let data;
  try { data = JSON.parse(fs.readFileSync(filePath, "utf-8")); } catch { continue; }
  if (!data.priceTracking?.enabled) continue;
  if (data.marketMetrics?.estimatedSource !== "ai_estimate") continue;

  const slug = data.slug;
  const genus = (data.genus || "").toLowerCase();
  const newPrice = CORRECTIONS[`${genus}/${slug}`] ?? CORRECTIONS[slug];

  if (!newPrice) { notInMap++; continue; }

  const oldPrice = data.marketMetrics.currentMedianPriceGBP;
  const direction = newPrice < oldPrice ? "↓" : "↑";
  console.log(`  ${isDryRun ? "[DRY] " : ""}${slug.padEnd(55)} £${String(oldPrice).padStart(4)} → £${newPrice} ${direction}`);

  if (!isDryRun) {
    data.marketMetrics.currentMedianPriceGBP = newPrice;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    updated++;
  } else {
    skipped++;
  }
}

console.log(`\nDone. Updated: ${updated}, Dry-run: ${skipped}, Unchanged (not in map): ${notInMap}`);
