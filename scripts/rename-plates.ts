/**
 * CLI tool: npx tsx scripts/rename-plates.ts [--dry-run] [--force-api]
 *
 * Scans the "Finished Plates" directory for files matching "ChatGPT Image"
 * and renames them to the plant names written on the botanical plates.
 * Uses a hardcoded mapping for existing files to save API calls, and
 * falls back to Gemini 2.5 Flash Vision API for new or unrecognized files.
 */

import fs from "fs";
import path from "path";

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const forceApi = args.includes("--force-api");

// Directory paths
const targetDir = path.join(process.cwd(), "Finished Plates");

// Hardcoded fallback mapping to save API requests and handle current files out of the box
const HARDCODED_MAP: Record<string, string> = {
  "ChatGPT Image Jun 13, 2026, 11_26_17 PM.png": "Monstera 'Devil Monster'",
  "ChatGPT Image Jun 13, 2026, 11_51_14 PM.png": "Alocasia sp.",
  "ChatGPT Image Jun 14, 2026, 10_33_24 PM.png": "Anthurium 'Delta Force'",
  "ChatGPT Image Jun 14, 2026, 12_06_18 AM.png": "Alocasia sp.",
  "ChatGPT Image Jun 17, 2026, 10_50_44 PM.png": "Monstera 'Burle Marx Flame'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (1).png": "Philodendron x joepii 'Aurea Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (1) (1).png": "Philodendron x joepii 'Aurea Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (2).png": "Philodendron ilsemanii 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (2) (1).png": "Philodendron ilsemanii 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (3).png": "Philodendron patriciae 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (3) (1).png": "Philodendron patriciae 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (4).png": "Philodendron 'Whipple Way'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (4) (1).png": "Philodendron 'Whipple Way'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (5).png": "Monstera obliqua (Peru form)",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (5) (1).png": "Monstera obliqua (Peru form)",
  "ChatGPT Image Jun 18, 2026, 05_32_38 PM (5).png": "Monstera obliqua (Peru form)",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (1).png": "Anthurium papillilaminum 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (2).png": "Anthurium luxurians 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (3).png": "Anthurium 'Ace of Spades' Variegata",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (4).png": "Alocasia reginula 'Black Velvet' Pink Albo Variegata",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (5).png": "Alocasia cuprea 'Pink Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (1).png": "Anthurium papillilaminum 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (2).png": "Anthurium luxurians 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (3).png": "Anthurium 'Ace of Spades' Variegata",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (4).png": "Alocasia reginula 'Black Velvet' Pink Albo Variegata",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (5).png": "Alocasia cuprea 'Pink Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (1).png": "Philodendron mexicanum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (2).png": "Philodendron lupinum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (3).png": "Anthurium forgetii 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (4).png": "Monstera pinnatipartita 'Albo Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (5).png": "Alocasia baginda 'Dragon Scale' Albo Variegata",
  "ChatGPT Image Jun 19, 2026, 10_06_10 PM.png": "Philodendron atabapoense 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_06_20 PM (2).png": "Philodendron verrucosum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_06_21 PM (3).png": "Anthurium regale 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_06_21 PM (4).png": "Monstera dubia 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_06_21 PM (5).png": "Alocasia azlanii 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_11_55 PM (1).png": "Philodendron sodiroi 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_11_55 PM (2).png": "Anthurium dressleri 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_11_56 PM (3).png": "Monstera siltepecana 'El Salvador Form'",
  "ChatGPT Image Jun 19, 2026, 10_11_56 PM (4).png": "Alocasia nebula 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_11_56 PM (5).png": "Philodendron nangaritense 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_45 PM (1).png": "Philodendron melanochrysum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_45 PM (2).png": "Philodendron camposportoanum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_46 PM (5).png": "Anthurium magnificum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_46 PM (6).png": "Anthurium vittariifolium 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_47 PM (7).png": "Monstera standleyana 'Aurea Variegated'",
  "ChatGPT Image Jun 19, 2026, 10_27_47 PM (8).png": "Rhaphidophora cryptantha 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_47 PM (9).png": "Alocasia longiloba 'Watsoniana Pink Doff Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_48 PM (10).png": "Scindapsus treubii 'Moonlight Variegated'",
  "ChatGPT Image Jun 19, 2026, 10_28_53 PM (1).png": "Anthurium crystallinum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_28_53 PM (2).png": "Philodendron gloriosum 'Tricolor'",
  "ChatGPT Image Jun 20, 2026, 09_15_47 AM (1).png": "Monstera croatii",
  "ChatGPT Image Jun 20, 2026, 09_15_47 AM (2).png": "Monstera spruceana",
  "ChatGPT Image Jun 20, 2026, 09_15_48 AM (3).png": "Philodendron tripartitum",
  "ChatGPT Image Jun 20, 2026, 09_15_48 AM (4).png": "Philodendron serpens",
  "ChatGPT Image Jun 20, 2026, 09_15_48 AM (5).png": "Anthurium pallidiflorum",
  "ChatGPT Image Jun 20, 2026, 09_15_48 AM (6).png": "Anthurium polyschistum",
  "ChatGPT Image Jun 20, 2026, 09_15_48 AM (7).png": "Alocasia infernalis",
  "ChatGPT Image Jun 20, 2026, 09_15_48 AM (8).png": "Alocasia chaii",
  "ChatGPT Image Jun 20, 2026, 09_15_49 AM (9).png": "Rhaphidophora foraminifera",
  "ChatGPT Image Jun 20, 2026, 09_15_49 AM (10).png": "Amydrium medium",
  "ChatGPT Image Jun 20, 2026, 04_27_42 PM (5).png": "Anthurium wendlingeri",
  "ChatGPT Image Jun 20, 2026, 04_27_43 PM (6).png": "Anthurium corrugatum",
  "ChatGPT Image Jun 20, 2026, 04_27_43 PM (8).png": "Alocasia sinuata",
  "ChatGPT Image Jun 20, 2026, 04_27_44 PM (9).png": "Rhaphidophora korthalsii",
  "ChatGPT Image Jun 20, 2026, 04_27_45 PM (10).png": "Amydrium zippelianum",
  "ChatGPT Image Jun 20, 2026, 05_12_17 PM (1).png": "Monstera punctulata",
  "ChatGPT Image Jun 20, 2026, 05_12_18 PM (2).png": "Philodendron fragrantissimum",
  "ChatGPT Image Jun 20, 2026, 05_12_18 PM (3).png": "Anthurium pendulifolium",
  "ChatGPT Image Jun 20, 2026, 05_12_19 PM (4).png": "Anthurium cutucuense",
  "ChatGPT Image Jun 20, 2026, 05_12_19 PM (5).png": "Alocasia reversa",
  "ChatGPT Image Jun 20, 2026, 05_12_20 PM (6).png": "Rhaphidophora decursiva",
  "ChatGPT Image Jun 20, 2026, 05_12_20 PM (7).png": "Amydrium humile",
  "ChatGPT Image Jun 20, 2026, 05_12_21 PM (8).png": "Epipremnum amplissimum",
  "ChatGPT Image Jun 20, 2026, 05_12_21 PM (10).png": "Scindapsus officinalis",
  "ChatGPT Image Jun 20, 2026, 05_24_13 PM.png": "Cercestis mirabilis",
  "ChatGPT Image Jun 20, 2026, 10_16_20 PM (1).png": "Monstera tuberculata",
  "ChatGPT Image Jun 20, 2026, 10_16_21 PM (3).png": "Philodendron stenolobum",
  "ChatGPT Image Jun 20, 2026, 10_16_22 PM (5).png": "Anthurium pendens",
  "ChatGPT Image Jun 20, 2026, 10_16_23 PM (6).png": "Alocasia melo",
  "ChatGPT Image Jun 20, 2026, 10_16_24 PM (7).png": "Rhaphidophora megasperma",
  "ChatGPT Image Jun 20, 2026, 10_16_24 PM (8).png": "Scindapsus lucens",
  "ChatGPT Image Jun 20, 2026, 10_16_25 PM (9).png": "Amydrium hainanense",
  "ChatGPT Image Jun 20, 2026, 10_16_25 PM (10).png": "Pothos barberianus",
  "ChatGPT Image Jun 20, 2026, 10_36_50 PM (1).png": "Monstera vasquezii",
  "ChatGPT Image Jun 20, 2026, 10_36_51 PM (2).png": "Monstera dubia",
  "ChatGPT Image Jun 20, 2026, 10_36_51 PM (3).png": "Philodendron distantilobum",
  "ChatGPT Image Jun 20, 2026, 10_36_51 PM (4).png": "Anthurium vittariifolium",
  "ChatGPT Image Jun 20, 2026, 10_36_51 PM (5).png": "Anthurium warocqueanum",
  "ChatGPT Image Jun 20, 2026, 10_36_52 PM (6).png": "Alocasia princeps",
  "ChatGPT Image Jun 20, 2026, 10_36_52 PM (7).png": "Rhaphidophora latevaginata",
  "ChatGPT Image Jun 20, 2026, 10_36_52 PM (8).png": "Scindapsus treubii",
  "ChatGPT Image Jun 20, 2026, 10_36_53 PM (9).png": "Amydrium sinense",
  "ChatGPT Image Jun 20, 2026, 10_36_53 PM (10).png": "Epipremnum giganteum",
  // Jun 26–27 2026 batch
  "ChatGPT Image Jun 26, 2026, 10_21_28 PM.png": "Philodendron 'Caramel Marble'",
  "ChatGPT Image Jun 27, 2026, 06_43_14 PM (4).png": "Monstera obliqua — Suriname Form",
  "ChatGPT Image Jun 27, 2026, 07_16_31 PM (1).png": "Monstera obliqua — Napo Form",
  "ChatGPT Image Jun 27, 2026, 07_16_31 PM (2).png": "Monstera obliqua — Sangay Form",
  "ChatGPT Image Jun 27, 2026, 07_16_31 PM (3).png": "Monstera obliqua — Tiwintza Form",
  "ChatGPT Image Jun 27, 2026, 07_16_31 PM (4).png": "Monstera obliqua — Yasuni Form",
  "ChatGPT Image Jun 27, 2026, 07_16_31 PM (5).png": "Monstera obliqua — Pastaza Form",
  "ChatGPT Image Jun 27, 2026, 07_16_31 PM (6).png": "Monstera obliqua — Morona-Santiago Form",
  "ChatGPT Image Jun 27, 2026, 07_16_31 PM (7).png": "Monstera obliqua — Zamora-Chinchipe Form",
  "ChatGPT Image Jun 27, 2026, 07_16_31 PM (8).png": "Monstera obliqua — Putumayo Form",
  "ChatGPT Image Jun 27, 2026, 07_16_31 PM (9).png": "Monstera obliqua — Tarapoto Form",
  "ChatGPT Image Jun 27, 2026, 07_16_41 PM (1).png": "Monstera obliqua — Peru Form",
  "ChatGPT Image Jun 27, 2026, 07_16_41 PM (2).png": "Monstera obliqua — Bolivia Form",
  "ChatGPT Image Jun 27, 2026, 07_16_41 PM (3).png": "Monstera obliqua — Panama Form",
  // 07_16_41 PM (4) is a duplicate Suriname Form plate — intentionally omitted
  "ChatGPT Image Jun 27, 2026, 07_16_42 PM (5).png": "Monstera obliqua — Amazonas Form",
  "ChatGPT Image Jun 27, 2026, 07_16_42 PM (6).png": "Monstera obliqua — Amazonas B Form",
  "ChatGPT Image Jun 27, 2026, 07_16_43 PM (7).png": "Monstera obliqua — Amazonas Peru Form",
  "ChatGPT Image Jun 27, 2026, 07_16_43 PM (8).png": "Monstera obliqua — French Guiana Locality Form",
  "ChatGPT Image Jun 27, 2026, 07_16_43 PM (9).png": "Monstera obliqua — Trinidad Locality Form",
  "ChatGPT Image Jun 27, 2026, 07_16_44 PM (10).png": "Monstera obliqua — Costa Rica Locality Form",
  "ChatGPT Image Jun 27, 2026, 10_26_28 PM (1).png": "Monstera standleyana",
  "ChatGPT Image Jun 27, 2026, 10_26_28 PM (2).png": "Monstera siltepecana",
  "ChatGPT Image Jun 27, 2026, 10_26_29 PM (4).png": "Monstera pinnatipartita",
  "ChatGPT Image Jun 27, 2026, 10_26_29 PM (6).png": "Monstera acuminata",
  "ChatGPT Image Jun 27, 2026, 10_26_29 PM (7).png": "Monstera epipremnoides",
  "ChatGPT Image Jun 27, 2026, 10_26_29 PM (8).png": "Monstera aureopinnata",
  "ChatGPT Image Jun 27, 2026, 10_26_30 PM (9).png": "Monstera cenepensis",
  "ChatGPT Image Jun 27, 2026, 10_26_30 PM (10).png": "Monstera costaricensis",
  "ChatGPT Image Jun 27, 2026, 10_33_29 PM (1).png": "Monstera oreophila",
  "ChatGPT Image Jun 27, 2026, 10_33_29 PM (2).png": "Monstera egregia",
  "ChatGPT Image Jun 27, 2026, 10_33_29 PM (3).png": "Monstera xanthospatha",
  "ChatGPT Image Jun 27, 2026, 10_33_29 PM (4).png": "Monstera membranacea",
  "ChatGPT Image Jun 27, 2026, 10_33_29 PM (5).png": "Monstera pittieri",
  "ChatGPT Image Jun 27, 2026, 10_33_29 PM (6).png": "Monstera gentryi",
  "ChatGPT Image Jun 27, 2026, 10_33_29 PM (7).png": "Monstera mittermeieri",
  "ChatGPT Image Jun 27, 2026, 10_33_29 PM (8).png": "Monstera florescanoana",
  "ChatGPT Image Jun 27, 2026, 10_33_29 PM (9).png": "Monstera tacanaensis",
  "ChatGPT Image Jun 27, 2026, 10_33_30 PM (10).png": "Monstera integrifolia",
  // Jun 30, 2026 batch — 01:50 PM (8 files)
  "ChatGPT Image Jun 30, 2026, 01_50_26 PM (1).png": "Philodendron gloriosum",
  // (2) is an older-style duplicate of Philodendron melanochrysum — use (alt) to avoid collision with 07_43 canonical plate
  "ChatGPT Image Jun 30, 2026, 01_50_26 PM (2).png": "Philodendron melanochrysum (alt)",
  // (3) is an older-style duplicate of Pink Princess — use (alt) to avoid collision with 08_09 canonical plate
  "ChatGPT Image Jun 30, 2026, 01_50_26 PM (3).png": "Philodendron erubescens 'Pink Princess' (alt)",
  "ChatGPT Image Jun 30, 2026, 01_50_26 PM (4).png": "Philodendron micans",
  "ChatGPT Image Jun 30, 2026, 01_50_26 PM (5).png": "Philodendron brandtianum",
  "ChatGPT Image Jun 30, 2026, 01_50_26 PM (6).png": "Philodendron mamei",
  "ChatGPT Image Jun 30, 2026, 01_50_26 PM (7).png": "Philodendron gigas",
  "ChatGPT Image Jun 30, 2026, 01_50_26 PM (8).png": "Philodendron chloanthum",
  // Jun 30, 2026 batch — 04:18–07:43 PM (16 files)
  "ChatGPT Image Jun 30, 2026, 04_18_06 PM (1).png": "Philodendron 'Jose Buono'",
  "ChatGPT Image Jun 30, 2026, 04_18_06 PM (2).png": "Monstera deliciosa 'Albo Variegata'",
  "ChatGPT Image Jun 30, 2026, 04_18_07 PM (3).png": "Monstera standleyana 'Albo Variegata'",
  "ChatGPT Image Jun 30, 2026, 04_18_07 PM (4).png": "Epipremnum pinnatum 'Marble Variegata'",
  "ChatGPT Image Jun 30, 2026, 04_18_07 PM (5).png": "Scindapsus pictus 'Tricolor'",
  "ChatGPT Image Jun 30, 2026, 04_26_04 PM.png": "Alocasia chaii 'Variegata'",
  "ChatGPT Image Jun 30, 2026, 05_30_16 PM.png": "Alocasia chaii",
  "ChatGPT Image Jun 30, 2026, 07_43_41 PM (2).png": "Philodendron melanochrysum",
  "ChatGPT Image Jun 30, 2026, 07_43_42 PM (3).png": "Philodendron pastazanum",
  "ChatGPT Image Jun 30, 2026, 07_43_42 PM (4).png": "Philodendron martianum",
  "ChatGPT Image Jun 30, 2026, 07_43_43 PM (5).png": "Anthurium regale",
  "ChatGPT Image Jun 30, 2026, 07_43_43 PM (6).png": "Anthurium magnificum",
  "ChatGPT Image Jun 30, 2026, 07_43_43 PM (7).png": "Alocasia azlanii",
  "ChatGPT Image Jun 30, 2026, 07_43_44 PM (8).png": "Alocasia cuprea",
  "ChatGPT Image Jun 30, 2026, 07_43_44 PM (9).png": "Rhaphidophora cryptantha",
  "ChatGPT Image Jun 30, 2026, 07_43_44 PM (10).png": "Syngonium chiapense 'Variegata'",
  // Jun 30, 2026 batch — 07:54 PM (10 files)
  "ChatGPT Image Jun 30, 2026, 07_54_02 PM (1).png": "Monstera subpinnata",
  "ChatGPT Image Jun 30, 2026, 07_54_02 PM (2).png": "Monstera lechleriana",
  "ChatGPT Image Jun 30, 2026, 07_54_03 PM (3).png": "Philodendron tortum",
  "ChatGPT Image Jun 30, 2026, 07_54_03 PM (4).png": "Philodendron patriciae",
  "ChatGPT Image Jun 30, 2026, 07_54_03 PM (5).png": "Anthurium pallidiflorum",
  "ChatGPT Image Jun 30, 2026, 07_54_04 PM (6).png": "Anthurium corrugatum",
  "ChatGPT Image Jun 30, 2026, 07_54_04 PM (7).png": "Alocasia infernalis",
  "ChatGPT Image Jun 30, 2026, 07_54_04 PM (8).png": "Alocasia nebula",
  "ChatGPT Image Jun 30, 2026, 07_54_05 PM (9).png": "Rhaphidophora hayi",
  "ChatGPT Image Jun 30, 2026, 07_54_05 PM (10).png": "Amydrium medium",
  // Jun 30, 2026 batch — 08:09 PM (10 files)
  "ChatGPT Image Jun 30, 2026, 08_09_51 PM (1).png": "Epipremnum aureum 'Marble Queen'",
  "ChatGPT Image Jun 30, 2026, 08_09_51 PM (2).png": "Epipremnum aureum 'N'Joy'",
  "ChatGPT Image Jun 30, 2026, 08_09_51 PM (3).png": "Epipremnum aureum 'Manjula'",
  "ChatGPT Image Jun 30, 2026, 08_09_52 PM (4).png": "Monstera adansonii 'Variegata'",
  "ChatGPT Image Jun 30, 2026, 08_09_52 PM (5).png": "Monstera deliciosa 'Aurea Variegata'",
  "ChatGPT Image Jun 30, 2026, 08_09_52 PM (6).png": "Syngonium podophyllum 'Albo Variegatum'",
  "ChatGPT Image Jun 30, 2026, 08_09_52 PM (7).png": "Syngonium podophyllum 'Mojito'",
  "ChatGPT Image Jun 30, 2026, 08_09_52 PM (8).png": "Philodendron erubescens 'White Princess'",
  "ChatGPT Image Jun 30, 2026, 08_09_52 PM (9).png": "Philodendron erubescens 'Pink Princess'",
  "ChatGPT Image Jun 30, 2026, 08_09_52 PM (10).png": "Alocasia macrorrhizos 'Variegata'",
  // Jun 30, 2026 batch — 10:56 PM (10 files)
  "ChatGPT Image Jun 30, 2026, 10_56_25 PM (1).png": "Philodendron radiatum",
  "ChatGPT Image Jun 30, 2026, 10_56_25 PM (2).png": "Philodendron pedatum",
  "ChatGPT Image Jun 30, 2026, 10_56_25 PM (3).png": "Monstera siltepecana",
  "ChatGPT Image Jun 30, 2026, 10_56_26 PM (4).png": "Rhaphidophora foraminifera",
  "ChatGPT Image Jun 30, 2026, 10_56_27 PM (5).png": "Syngonium wendlandii",
  "ChatGPT Image Jun 30, 2026, 10_56_27 PM (6).png": "Syngonium rayii",
  "ChatGPT Image Jun 30, 2026, 10_56_28 PM (7).png": "Anthurium schlechtendalii",
  "ChatGPT Image Jun 30, 2026, 10_56_28 PM (8).png": "Anthurium scandens",
  "ChatGPT Image Jun 30, 2026, 10_56_28 PM (9).png": "Alocasia sinuata",
  "ChatGPT Image Jun 30, 2026, 10_56_28 PM (10).png": "Homalomena rubescens",
  // Jun 30, 2026 batch — 11:01 PM (4 files)
  "ChatGPT Image Jun 30, 2026, 11_01_20 PM.png": "Philodendron 'Florida Ghost'",
  "ChatGPT Image Jun 30, 2026, 11_01_32 PM.png": "Philodendron 'McColley's Finale'",
  "ChatGPT Image Jun 30, 2026, 11_01_42 PM.png": "Philodendron 'Florida Beauty'",
  // (11_01_51 PM) is a second Florida Ghost plate — use (alt) to avoid collision with 11_01_20 canonical plate
  "ChatGPT Image Jun 30, 2026, 11_01_51 PM.png": "Philodendron 'Florida Ghost' (alt)",
};

// Simple dotenv parser
function getApiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("GEMINI_API_KEY=")) {
        return trimmed.substring("GEMINI_API_KEY=".length).replace(/['"]/g, "").trim();
      }
    }
  }
  return undefined;
}
// Clean plant name for use as a safe filename
function sanitizeFilename(name: string): string {
  // Remove formatting characters, quotes, or trailing/leading periods if necessary,
  // but keep single quotes since they are common in cultivar names (e.g. 'Devil Monster')
  let cleaned = name.replace(/[\\/:*?"<>|]/g, "").trim();
  // Strip enclosing quotes if they got returned by the LLM
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  // Remove trailing dots to prevent issues like "Alocasia sp..png"
  while (cleaned.endsWith(".")) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  return cleaned;
}// Check mime type from extension
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

// Make a Vision API request to Gemini to identify the plant name
async function queryGeminiVision(filePath: string, apiKey: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString("base64");
  const mimeType = getMimeType(filePath);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: "Identify the plant name from this botanical plate. Look at the large text headers, scientific name, or species/cultivar sections. Return ONLY the plant name itself (e.g. \"Monstera 'Devil Monster'\" or \"Philodendron x joepii 'Aurea Variegata'\"). Do not include any explanation, intro, markdown formatting, or enclosing quotes.",
          },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const json = (await response.json()) as any;
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Invalid response shape from Gemini: ${JSON.stringify(json)}`);
  }

  return text.trim();
}

// Helper to find a non-colliding filename
function findUniquePath(dir: string, baseName: string, ext: string, allocated: Set<string>): string {
  let candidate = path.join(dir, `${baseName}${ext}`);
  if (!fs.existsSync(candidate) && !allocated.has(candidate)) {
    allocated.add(candidate);
    return candidate;
  }

  let counter = 1;
  while (true) {
    candidate = path.join(dir, `${baseName} (${counter})${ext}`);
    if (!fs.existsSync(candidate) && !allocated.has(candidate)) {
      allocated.add(candidate);
      return candidate;
    }
    counter++;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  BOTANICAL PLATE RENAMING TOOL");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("⚠️ RUNNING IN DRY-RUN MODE: No files will actually be renamed.\n");
  }

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory does not exist at "${targetDir}"`);
    process.exit(1);
  }

  const apiKey = getApiKey();
  if (!apiKey && forceApi) {
    console.error("Error: --force-api requires GEMINI_API_KEY to be set in env or .env.local");
    process.exit(1);
  }

  const files = fs.readdirSync(targetDir).filter((file) => {
    return file.startsWith("ChatGPT Image") && fs.statSync(path.join(targetDir, file)).isFile();
  });

  if (files.length === 0) {
    console.log("No new 'ChatGPT Image' files found in Finished Plates folder.");
    return;
  }

  console.log(`Found ${files.length} images to process.\n`);

  const allocatedPaths = new Set<string>();

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const ext = path.extname(file);
    let plantName: string | null = null;

    console.log(`Processing: "${file}"`);

    // Step 1: Check if we can use hardcoded mapping
    if (HARDCODED_MAP[file] && !forceApi) {
      plantName = sanitizeFilename(HARDCODED_MAP[file]);
      console.log(`  ✓ Found in local database: "${plantName}"`);
    } else {
      // Step 2: Use Gemini API if available
      if (apiKey) {
        try {
          console.log("  Calling Gemini Vision API...");
          const identifiedName = await queryGeminiVision(fullPath, apiKey);
          plantName = sanitizeFilename(identifiedName);
          console.log(`  ✓ Gemini identified: "${plantName}"`);
          // Sleep for 5 seconds to prevent hitting rate limits
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (err) {
          console.error(`  ✗ Gemini vision call failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        console.log("  ⚠️ No GEMINI_API_KEY found. Skipping Gemini Vision call.");
      }
    }

    if (!plantName) {
      console.log(`  ⚠️ Skipping file (could not resolve name).\n`);
      continue;
    }

    // Step 3: Determine destination
    const destPath = findUniquePath(targetDir, plantName, ext, allocatedPaths);
    const destName = path.basename(destPath);

    console.log(`  Destination: "${destName}"`);

    if (!isDryRun) {
      try {
        fs.renameSync(fullPath, destPath);
        console.log("  ✓ Successfully renamed.");
      } catch (err) {
        console.error(`  ✗ Rename failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log("");
  }

  console.log("=".repeat(60));
  console.log("Plate renaming run completed.");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
