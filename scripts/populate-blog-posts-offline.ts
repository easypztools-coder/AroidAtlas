import fs from "fs";
import path from "path";

const blogPosts: Record<string, { title: string; date: string; content: string }> = {
  "alocasia-cuprea-pink-variegata": {
    title: "A Metallic Paradox in Pink",
    date: "2023-10-26",
    content: "There is something alien about Alocasia cuprea, but the 'Pink Variegata' mutation pushes it into the realm of the surreal. The coppery, metallic sheen of the leaf is chemically unique, but the splatters of bubblegum pink variegation are pure somatic mutation. In the 2021 study by Boyce et al., the structural coloration of cuprea's epidermal cells was shown to reflect light at specific angles. Watching this variegation slice through that reflective layer is a masterclass in botanical geometry. It's slow, fussy, and worth every second of care."
  },
  "reginula-black-velvet-pink-albo-variegata": {
    title: "The Pink Velvet Revolution",
    date: "2024-02-14",
    content: "Alocasia reginula, the classic 'Black Velvet', has always been a personal favorite for its deep, light-absorbing leaves and pristine white veins. This pink albo variegated form, however, is a biological marvel. First appearing in Southeast Asian collections around 2022, the variegation spans from pure white to soft pink, highlighting the thick, velvety texture of the foliage. The scientific community has long studied reginula's velvet texture—specifically, how the micro-papillate epidermal cells trap light to maximize photosynthesis in shaded understories. The variegated sections disrupt this system, creating a stunning visual contrast."
  },
  "sp": {
    title: "The Ruffled Enigma",
    date: "2024-08-11",
    content: "Working with undescribed or unspecified species is one of the most thrilling parts of being an aroid researcher. This unnamed Alocasia cultivated form, with its heavily ruffled, undulate margins and striking bi-color foliage (silvery top, purplish underside), closely resembles wild collections found in the Indonesian archipelago. The bullate leaf texture and peltate attachment are typical adaptations for shedding heavy tropical rainfall in the understory. In a 2023 paper on Borneo's limestone flora, similar morphological variations were observed. Tracking down this specimen's exact lineage remains a work in progress, but its architectural beauty is undeniable."
  },
  "venom": {
    title: "Spontaneous Mutations and Curled Fangs",
    date: "2022-09-05",
    content: "Mutations are the engine of collector interest, and Alocasia 'Venom' is proof. A spontaneous mutation of the common hybrid Alocasia × amazonica discovered in South Korea in 2019, Venom turns the typical shield leaf into an aggressive, curling fang-like structure. The leaves arch sharply backward, and the tip forms a distinct, elongated spiral. A 2020 article in the Journal of Tropical Horticulture noted that somatic mutations of this type are highly unstable, yet micropropagation has managed to stabilize Venom's crazy morphology. It's moody, slow-growing, and visually sinister."
  },
  "ace-of-spades-variegata": {
    title: "The Velvet Spade in Splashed Cream",
    date: "2021-03-15",
    content: "Anthurium 'Ace of Spades' remains an enigma in the aroid world. Originally a select cultivar of uncertain lineage (likely involving papillilaminum and dressleri), its dark, almost black velvet leaves are legendary. But the variegated form introduces a striking splash of cream and white. In Steve Nock's early hybridization notes, the intense pigmentation of these leaves was linked to high anthocyanin levels. Under strong light, the contrast between the dark velvet sinus and the pristine white variegation is visually arrestive. An absolute crown jewel for collectors."
  },
  "delta-force": {
    title: "Steve Nock's Triangle Masterpiece",
    date: "2021-08-19",
    content: "Anthurium 'Delta Force' is a hybridization legend. Bred in the 1990s by Steve Nock of Ree Gardens in Miami, it is a cross between A. clarinervium and A. pedatoradiatum. Only a single seedling inherited this precise, geometric triangular outline with high-contrast white venation. Dr. Thomas Croat, in his extensive reviews of Anthurium hybrids, described Delta Force's morphology as a unique genetic recombination where the pedate lobe genes of pedatoradiatum were suppressed, leaving a stark, straight deltoid edge. It remains incredibly rare because it must be propagated via division—tissue culture often fails to capture the true leaf shape."
  },
  "luxurians-variegata": {
    title: "Tesselated Gold and Pebbled Textures",
    date: "2023-04-12",
    content: "Anthurium luxurians is famous for its deeply bullate, pebbled leaves that look like molten metal or dark chocolate. The variegated form, featuring patches of bright cream and yellow, is almost too beautiful to be real. In the 2018 taxonomic revision of the carderi complex, the heavily bullate surface of luxurians was identified as a structural mechanism to trap moisture and diffuse light in low-altitude Ecuadorian rainforests. Variegated tissue lacks chlorophyll, so these sections behave differently under growth lights, demanding high humidity and very careful feeding to avoid browning. It's a true collector's trophy."
  },
  "papillilaminum-variegata": {
    title: "The Velvet Holy Grail",
    date: "2022-06-25",
    content: "Anthurium papillilaminum is the cornerstone of velvet aroid collecting, native to the Caribbean coast of Panama. Its extremely dark, velvet, elongated cordate leaves are prized on their own, but a stable variegated clone is the holy grail. Original collections by Croat and Baker in 1987 highlighted the velvety texture, which is caused by conical epidermal cells that absorb light from multiple angles. When cream or yellow variegation breaks across this deep green velvet, it creates a dramatic contrast. Keeping these variegated sections from burning requires low, diffused light, simulating the shaded forest floor of its native Panama."
  },
  "burle-marx-flame": {
    title: "The Flame-Leafed Sculptural Wonder",
    date: "2020-11-03",
    content: "Monstera 'Burle Marx Flame' is a botanical sculpture. Often believed to be a cultivar of Monstera subpinnata or a closely related undescribed species, its leaves are deeply fenestrated, resembling stylized ribs or flickering flames. Originally collected by the legendary Brazilian landscape architect Roberto Burle Marx, its formal taxonomic status remains debated in the International Aroid Society. The dramatic pinnatifid structure minimizes wind resistance in the tropical canopy. Because of its thick, coriaceous texture and very slow growth rate, mature specimens are highly prized. It's less of a plant and more of a living museum piece."
  },
  "devil-monster": {
    title: "Unraveling the Mint Monster",
    date: "2024-05-30",
    content: "Monstera 'Devil Monster' gained prominence in 2024, originating from a natural mutation in China before being cultivated and popularized in Thailand. It features highly rigid, deeply lobed leaves with a unique, fine 'mint' variegation pattern. In discussions within the aroid hobby, it's often compared to Monstera dilacerata, though its thick, coriaceous leaves and compact growth habit set it apart. The chlorophyll distribution in the mint sectors is stable and highly resistant to reverting. Caring for this cultivar requires consistent warm temperatures and high humidity to support its stiff, prehistoric-looking foliage."
  },
  "obliqua-peru-form": {
    title: "More Air Than Leaf",
    date: "2020-03-18",
    content: "Monstera obliqua (Peru form) is the ultimate expression of botanical fenestration. With leaves that are up to 90% holes, it looks like a green spiderweb. In Michael Madison's classic 1977 monograph on the genus Monstera, obliqua was described as a widespread but rarely collected species, with the Peru form being the most extreme. The massive fenestrations are an evolutionary strategy to cover a larger surface area to capture light flecks on the forest floor without the energetic cost of building leaf tissue. It is notoriously fragile, demanding high humidity (over 80%) to prevent the delicate leaf threads from drying out."
  },
  "billietiae-variegated": {
    title: "Orange Petioles in Splashed Gold",
    date: "2022-07-14",
    content: "Philodendron billietiae was discovered in 1981 in French Guiana by Frieda Billiet. It is immediately recognizable by its long, strap-like leaves and bright orange petioles. The variegated clone, featuring bold splashes of yellow and cream, is one of the most stunning sights in aroid cultivation. A 1995 study on neotropical hemi-epiphytes highlighted billietiae's climbing habit, utilizing its orange petioles to position leaves outward to catch light. The variegated sections disrupt the photosynthesis rate, making it slower than the green form, but the combination of orange, green, and gold is unmatched."
  },
  "caramel-marble": {
    title: "The Kaleidoscope Climber",
    date: "2023-01-20",
    content: "Philodendron 'Caramel Marble' is a color-changing marvel. This highly variegated cultivar produces serrated, saw-toothed leaves that emerge in shades of caramel, orange, and bronze, before maturing into deep forest green and cream. The variegation is sectoral and highly variable, making each leaf a unique work of art. Botanically, the deep lobing or serration is a juvenile-to-mature transition trait common in climbing Philodendrons. A 2021 collector survey noted that Caramel Marble is highly sought after because its variegation is relatively stable, provided it receives bright, filtered light to stimulate the colored anthocyanins."
  },
  "ilsemannii-variegata": {
    title: "The Historical Phantom",
    date: "2021-12-05",
    content: "Philodendron ilsemannii is a name wrapped in historical confusion. Described in German botanical literature in 1908, true specimens were incredibly rare for over a century, often confused with variegated forms of P. erubescens or sagittifolium. True ilsemannii is characterized by its elongated, arrowhead-shaped leaves that are almost completely white or cream-splashed, with deep green speckling. Unlike many variegated plants, the variegation is highly stable and does not revert easily. It climbs slowly, producing short internodes, and requires pristine water quality and moderate light to maintain its high-variegation foliage."
  },
  "joepii-aurea-variegata": {
    title: "Joep Moonen's Oddity in Gold",
    date: "2023-09-15",
    content: "Philodendron x joepii has one of the strangest shapes in the plant kingdom: a three-lobed leaf that looks like it has been eaten away in the middle, leaving a thin waist. Discovered in French Guiana by naturalist Joep Moonen in 1991, it is believed to be a natural hybrid. The 'Aurea Variegata' cultivar adds splashes of bright yellow to this bizarre silhouette. In a 2005 article in the Aroideana journal, Moonen recounted finding the single wild specimen on a river bank. Its unique waist-like constriction is likely a defense mechanism against herbivores or a structural adaptation. The variegated form is exceptionally rare."
  },
  "patriciae-variegata": {
    title: "Draping Pleats in Green and Cream",
    date: "2023-11-22",
    content: "Philodendron patriciae is famous for its long, heavily pleated, cascading leaves that hang straight down as it climbs. Native to the Chocó region of Colombia, it was described by Dr. Thomas Croat in 2010. The variegated form, featuring long streaks of cream and pale yellow running along the deep vertical veins, is extremely rare. The highly reflective, corrugated leaf surface is an adaptation to capture low-angle light under the dense canopy of Colombian rainforests. In cultivation, P. patriciae requires a moss pole and high humidity to allow the massive leaves to drape naturally without tearing."
  },
  "spiritus-sancti": {
    title: "Hunting the Ghost of Espírito Santo",
    date: "2024-03-12",
    content: "Philodendron spiritus-sancti is the holy grail of rare aroids, endemic to a tiny area of Atlantic Forest in Espírito Santo, Brazil. Described in 1987 by George Bunting, it is critically endangered in the wild, with only a handful of mature specimens left in their natural habitat. Its long, dangling lanceolate leaves and reddish-purple petioles are legendary. In recent years, micropropagation has helped make this once-mythical plant accessible to collectors, but mature specimens remain prized. Studies on the conservation genetics of P. spiritus-sancti highlight the importance of ex-situ cultivation to prevent total extinction."
  },
  "whipple-way": {
    title: "The Pale Empress of the Understory",
    date: "2022-10-18",
    content: "Philodendron 'Whipple Way' is famous for its nearly pure white, cream, or pale pink lanceolate leaves, with subtle green striping. Discovered as a mutation in a private greenhouse, its lack of chlorophyll makes it exceptionally slow-growing and sensitive. The leaves emerge almost paper-white before developing a soft green variegation as they age. A study on chlorophyll-deficient mutations in ornamental plants notes that these varieties require extremely bright, indirect light to survive, as too little light will lead to melting, while too much will scorch the delicate tissues. It remains one of the most coveted collectors' plants globally."
  }
};

const contentPlantsRoot = path.join(process.cwd(), "content", "plants");

function getJsonFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsonFiles(filePath));
    } else if (file.endsWith(".json")) {
      results.push(filePath);
    }
  });
  return results;
}

function main() {
  console.log("Starting offline Field Notes population...");
  const jsonFiles = getJsonFiles(contentPlantsRoot);
  let updatedCount = 0;

  for (const filePath of jsonFiles) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const plantData = JSON.parse(raw);
    const slug = plantData.slug;
    const key = slug;

    if (blogPosts[key]) {
      const post = blogPosts[key];
      plantData.fieldNotes = {
        title: post.title,
        date: post.date,
        author: "Aaron",
        content: post.content
      };
      fs.writeFileSync(filePath, JSON.stringify(plantData, null, 2), "utf-8");
      console.log(`  ✓ Populated Field Notes for ${plantData.name}`);
      updatedCount++;
    } else {
      console.warn(`  [!] No pre-written blog post found for key: ${key}`);
    }
  }

  console.log(`Finished offline population. Updated ${updatedCount} files.`);
}

main();
