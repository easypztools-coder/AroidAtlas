const fs = require("fs");
const path = require("path");

const projectRoot = "c:/Users/nicho/OneDrive/Documents/Web Development/Ariod Atlas AG/AriodAtlas";
const sourceDir = path.join(projectRoot, "Finished Plates");
const contentPlantsRoot = path.join(projectRoot, "content", "plants");

const plants = [
  {
    name: "Monstera tuberculata",
    slug: "tuberculata",
    scientificName: "Monstera tuberculata Sutherl.",
    commonName: "Tuberculata Shingling Monstera",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Monstera",
    species: "tuberculata",
    origin: "Central to South America",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Monstera tuberculata is a highly unique shingling aroid native to the tropical rainforests of Central and South America. In its juvenile stage, it shingles tightly against tree bark with heart-shaped, overlapping leaves that have a rough, tuberculate texture. As it matures and climbs higher, it produces larger foliage and eventually hangs or forms fertile branches. The species is highly appreciated by collectors for its dramatic shingling form and textured leaves.",
    quickFacts: {
      growthHabit: "Shingling to climbing liana",
      matureSize: "Medium climber (1.5-2.5m)",
      light: "Medium Indirect Light",
      humidity: "High (70-85%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Moderate",
      growthSpeed: "Slow to Moderate"
    },
    morphology: {
      leafShape: "Broadly ovate, cordate, shingling",
      leafLength: "8-15cm (juvenile)",
      leafWidth: "6-12cm",
      petioleColor: "Green, extremely short",
      venation: "Inconspicuous",
      texture: "Rough, tuberculate (bumpy), matte",
      variegation: "None",
      growthHabit: "Shingling closely against support"
    },
    query: "Monstera tuberculata",
    filename: "Monstera tuberculata.png",
    targetFolder: "monstera"
  },
  {
    name: "Philodendron stenolobum",
    slug: "stenolobum",
    scientificName: "Philodendron stenolobum E.G.Gonç.",
    commonName: "Stenolobum Arborescent Philodendron",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Philodendron",
    species: "stenolobum",
    origin: "Brazil (Espírito Santo, Minas Gerais, Bahia)",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Philodendron stenolobum is an impressive, arborescent (tree-like) Philodendron native to the Atlantic forest of eastern Brazil. Unlike typical climbing or sprawling philodendrons, it grows with a thick woody stem and forms a massive rosette of highly elongated, narrow, strap-like leaves with deeply wavy (undulated) margins. The mature leaves hang down elegantly, making it a highly sculptural specimen. It thrives in bright indirect light and is incredibly robust once established.",
    quickFacts: {
      growthHabit: "Arborescent, self-heading",
      matureSize: "Large (leaves up to 1-1.5m long)",
      light: "Bright Indirect Light",
      humidity: "Moderate to High (60-80%)",
      temperature: "Warm (18-30°C)",
      difficulty: "Easy to Moderate",
      growthSpeed: "Moderate"
    },
    morphology: {
      leafShape: "Highly elongated linear-lanceolate, undulated margins",
      leafLength: "80-150cm",
      leafWidth: "10-20cm",
      petioleColor: "Dark green, sturdy",
      venation: "Prominent thick midrib",
      texture: "Thick, leathery (coriaceous), semi-glossy",
      variegation: "None",
      growthHabit: "Rosette from central arborescent stem"
    },
    query: "Philodendron stenolobum",
    filename: "Philodendron stenolobum.png",
    targetFolder: "philodendron"
  },
  {
    name: "Anthurium pendens",
    slug: "pendens",
    scientificName: "Anthurium pendens L.S.Croat",
    commonName: "Pendant Strap-Leaf Anthurium",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Anthurium",
    species: "pendens",
    origin: "Panama to Colombia",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Anthurium pendens is an elegant epiphytic species native to the cloud forests of Panama and Colombia. It is highly sought after for its long, narrow, ribbon-like leaves that hang vertically from epiphytic support. The foliage is matte to semi-glossy, dark green, and incredibly leathery. It grows compactly at the base, directing all its energy into producing long cascading leaves, making it perfect for hanging baskets or mounts where the foliage can gracefully hang.",
    quickFacts: {
      growthHabit: "Epiphytic, pendant",
      matureSize: "Medium to Large pendant (leaves 50-100cm)",
      light: "Medium Indirect Light",
      humidity: "High (70-90%)",
      temperature: "Intermediate to Warm (16-26°C)",
      difficulty: "Moderate",
      growthSpeed: "Slow to Moderate"
    },
    morphology: {
      leafShape: "Linear-lanceolate, strap-like",
      leafLength: "50-100cm",
      leafWidth: "4-8cm",
      petioleColor: "Green, short",
      venation: "Prominent midrib",
      texture: "Leathery, matte",
      variegation: "None",
      growthHabit: "Pendant epiphytic rosette"
    },
    query: "Anthurium pendens",
    filename: "Anthurium pendens.png",
    targetFolder: "anthurium"
  },
  {
    name: "Alocasia melo",
    slug: "melo",
    scientificName: "Alocasia melo A.Hay, P.C.Boyce & K.M.Wong",
    commonName: "Rugosa Jewel Alocasia",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Alocasia",
    species: "melo",
    origin: "Borneo (Sabah)",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Alocasia melo is a spectacular dwarf jewel Alocasia endemic to the Sabah region of Borneo, where it grows specifically in ultramafic soils on rocky forest slopes. It is famous for its extremely thick, almost cardboard-like leaves with a deeply rugose, brain-like texture and a dark bluish-green to grey-green coloration. The leaves form a compact, low-growing rosette. Due to its specific native habitat, it requires excellent drainage and careful watering, but rewards growers with its unmatched sculptural beauty.",
    quickFacts: {
      growthHabit: "Compact, self-heading",
      matureSize: "Small (20-30cm)",
      light: "Medium to bright indirect light",
      humidity: "High (70-85%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Moderate to Hard",
      growthSpeed: "Slow"
    },
    morphology: {
      leafShape: "Broadly ovate to peltate, deeply rugose",
      leafLength: "15-22cm",
      leafWidth: "12-18cm",
      petioleColor: "Greyish green",
      venation: "Deeply sunken primary and secondary veins",
      texture: "Extremely thick, stiff, rough, leather-like",
      variegation: "None",
      growthHabit: "Basal rosette from corm"
    },
    query: "Alocasia melo",
    filename: "Alocasia melo.png",
    targetFolder: "alocasia"
  },
  {
    name: "Rhaphidophora megasperma",
    slug: "rhaphidophora-megasperma",
    scientificName: "Rhaphidophora megasperma A.Hay",
    commonName: "Fishtail Rhaphidophora",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Rhaphidophora",
    species: "megasperma",
    origin: "Borneo",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Rhaphidophora megasperma is an intriguing climbing liana native to the primary rainforests of Borneo. It climbs host tree trunks using aerial rootlets. As the plant matures, it develops striking leaf divisions, with mature leaves splitting into asymmetrical lobes that resemble a fishtail or wings. The leaves are glossy green and moderately leathery. It is a robust climber that thrives in warm, humid conditions with support to encourage mature leaf morphology.",
    quickFacts: {
      growthHabit: "Root-climbing climber",
      matureSize: "Medium to Large climber (2-3m)",
      light: "Medium Indirect Light",
      humidity: "High (70-85%)",
      temperature: "Warm (20-28°C)",
      difficulty: "Easy to Moderate",
      growthSpeed: "Moderate to Fast"
    },
    morphology: {
      leafShape: "Deeply lobed, pinnatifid, fishtail-like",
      leafLength: "25-45cm",
      leafWidth: "15-30cm",
      petioleColor: "Green",
      venation: "Pinnate",
      texture: "Smooth, glossy",
      variegation: "None",
      growthHabit: "Climbing vining stem"
    },
    query: "Rhaphidophora megasperma",
    filename: "Rhaphidophora megasperma.png",
    targetFolder: "other"
  },
  {
    name: "Scindapsus lucens",
    slug: "scindapsus-lucens",
    scientificName: "Scindapsus lucens Bogner & P.C.Boyce",
    commonName: "Polished Leaf Scindapsus",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Scindapsus",
    species: "lucens",
    origin: "Sumatra (Indonesia)",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Scindapsus lucens is a rare and highly attractive climbing species native to Sumatra, Indonesia. It is outstanding for its highly shiny, deeply bullate (puckered) leaves that have a metallic, dark green finish. The leaves are ovate-lanceolate and shingle or sprawl as they climb. Unlike most variegated Scindapsus, the beauty of S. lucens lies in its texture and gloss, catching light beautifully. It grows best climbing up a moss pole in humid, warm conditions.",
    quickFacts: {
      growthHabit: "Root-climbing, shingling to vining",
      matureSize: "Medium climber (1.5-2.5m)",
      light: "Medium Indirect Light",
      humidity: "High (70-90%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Moderate",
      growthSpeed: "Moderate"
    },
    morphology: {
      leafShape: "Ovate-lanceolate, asymmetric, bullate",
      leafLength: "15-25cm",
      leafWidth: "8-15cm",
      petioleColor: "Green, short",
      venation: "Deeply quilted primary veins",
      texture: "Extremely glossy, puckered, bullate",
      variegation: "None",
      growthHabit: "Climbing, rooting at nodes"
    },
    query: "Scindapsus lucens",
    filename: "Scindapsus lucens.png",
    targetFolder: "other"
  },
  {
    name: "Amydrium hainanense",
    slug: "amydrium-hainanense",
    scientificName: "Amydrium hainanense (H.Li, Y.Shiao & S.L.Tseng) H.Li",
    commonName: "Hainan Sprawling Aroid",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Amydrium",
    species: "hainanense",
    origin: "Hainan (China) to Vietnam",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Amydrium hainanense is a rare creeping and climbing aroid native to the tropical forest floor and lower trunks of Hainan, China, and Vietnam. It features creeping, slender stems that trail or climb. The juvenile leaves are simple, glossy green, and heart-shaped, while the mature leaves display a highly elegant, deeply lobed or pinnate structure. It is relatively cold-tolerant compared to equatorial aroids but prefers high humidity and consistent moisture.",
    quickFacts: {
      growthHabit: "Creeping to climbing liana",
      matureSize: "Medium climber (1.5-2m)",
      light: "Medium to Low Indirect Light",
      humidity: "High (65-80%)",
      temperature: "Subtropical to Warm (15-26°C)",
      difficulty: "Moderate",
      growthSpeed: "Slow to Moderate"
    },
    morphology: {
      leafShape: "Ovate-cordate (juvenile) to pinnatifid (mature)",
      leafLength: "20-35cm",
      leafWidth: "12-20cm",
      petioleColor: "Green",
      venation: "Reticulate",
      texture: "Smooth, semi-glossy",
      variegation: "None",
      growthHabit: "Creeping stems, rooting at nodes"
    },
    query: "Amydrium hainanense",
    filename: "Amydrium hainanense.png",
    targetFolder: "other"
  },
  {
    name: "Pothos barberianus",
    slug: "pothos-barberianus",
    scientificName: "Pothos barberianus Schott",
    commonName: "Barberianus Climbing Pothos",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Pothos",
    species: "barberianus",
    origin: "Peninsula Malaysia, Sumatra, Borneo",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Pothos barberianus is a fascinating, true Pothos species (the genus Pothos is separate from Epipremnum, which is commonly called pothos) native to the humid forests of Peninsula Malaysia, Sumatra, and Borneo. It grows as a root-climbing liana, shingling and climbing tree trunks. A key characteristic of Pothos species is the winged petiole, which makes the leaf look like it is composed of two jointed leaf-like parts. P. barberianus features lanceolate, dark green, glossy leaves and is a highly unusual addition for serious aroid collectors.",
    quickFacts: {
      growthHabit: "Root-climbing climber",
      matureSize: "Medium climber (1.5-2.5m)",
      light: "Medium to Low Indirect Light",
      humidity: "High (70-85%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Moderate",
      growthSpeed: "Slow to Moderate"
    },
    morphology: {
      leafShape: "Lanceolate with a prominent winged petiole",
      leafLength: "12-20cm",
      leafWidth: "4-7cm",
      petioleColor: "Green, winged (foliaceous)",
      venation: "Pinnate, subtle",
      texture: "Leathery, glossy",
      variegation: "None",
      growthHabit: "Climbing, stems rooting at nodes"
    },
    query: "Pothos barberianus",
    filename: "Pothos barberianus.png",
    targetFolder: "other"
  },
  {
    name: "Monstera vasquezii",
    slug: "vasquezii",
    scientificName: "Monstera vasquezii Croat",
    commonName: "Vasquez's Monstera",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Monstera",
    species: "vasquezii",
    origin: "Peru",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Monstera vasquezii is a beautiful climbing aroid species native to Peru. It is similar to Monstera lechleriana but distinguished by its leaf shape and fenestrations. The mature leaves are large, broadly elliptic-ovate, and feature rows of small, round fenestrations along the midrib. The foliage is thick, leathery, and dark green. It climbs tree trunks using robust aerial roots and develops a spectacular, full appearance as it climbs.",
    quickFacts: {
      growthHabit: "Root-climbing climber",
      matureSize: "Large climber (2-3.5m)",
      light: "Medium Indirect Light",
      humidity: "High (70-85%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Easy to Moderate",
      growthSpeed: "Moderate to Fast"
    },
    morphology: {
      leafShape: "Broadly elliptic-ovate with small round fenestrations near midrib",
      leafLength: "35-55cm",
      leafWidth: "22-35cm",
      petioleColor: "Green",
      venation: "Prominent midrib",
      texture: "Coriaceous, semi-glossy",
      variegation: "None",
      growthHabit: "Climbing vining stem"
    },
    query: "Monstera vasquezii",
    filename: "Monstera vasquezii.png",
    targetFolder: "monstera"
  },
  {
    name: "Monstera dubia",
    slug: "dubia",
    scientificName: "Monstera dubia (Kunth) Ernesto-Rodr. & G.Gerlach",
    commonName: "Shingle Plant",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Monstera",
    species: "dubia",
    origin: "Central to South America",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "££",
    aboutText: "Monstera dubia is a famous shingling aroid native to the tropical rainforests of Central and South America. In its juvenile stage, it is known for heart-shaped, silver-variegated leaves that shingle flat against trees or boards. As it climbs and matures, it undergoes a dramatic transformation, losing its silver variegation and producing large, fenestrated green leaves that resemble Monstera deliciosa. This species is highly popular for showcasing the remarkable process of plant morphogenesis.",
    quickFacts: {
      growthHabit: "Shingling to root-climbing climber",
      matureSize: "Large climber (up to 3m)",
      light: "Medium Indirect Light",
      humidity: "High (65-80%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Easy to Moderate",
      growthSpeed: "Moderate"
    },
    morphology: {
      leafShape: "Heart-shaped (juvenile) to deeply fenestrated/lobed (mature)",
      leafLength: "8-15cm (juvenile) to 40-60cm (mature)",
      leafWidth: "6-12cm (juvenile)",
      petioleColor: "Green, short",
      venation: "Pinnate",
      texture: "Smooth, matte to semi-glossy",
      variegation: "Natural silver variegation (juvenile only)",
      growthHabit: "Shingling flat against support"
    },
    query: "Monstera dubia",
    filename: "Monstera dubia.png",
    targetFolder: "monstera"
  },
  {
    name: "Philodendron distantilobum",
    slug: "distantilobum",
    scientificName: "Philodendron distantilobum K.Krause",
    commonName: "Claw-Leaf Philodendron",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Philodendron",
    species: "distantilobum",
    origin: "Amazonian Brazil to Peru",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Philodendron distantilobum is a remarkable climbing species native to the Amazonian rainforests of Brazil and Peru. It is famous for its deeply lobed, pinnatisect leaves that resemble a claw or ribs. The lobes are narrow and widely separated (hence 'distantilobum'). It is a vigorous climber that attaches to supports using aerial roots. The mature plant is highly architectural and forms a stunning silhouette. It is easy to care for under standard tropical conditions.",
    quickFacts: {
      growthHabit: "Root-climbing climber",
      matureSize: "Large climber (2-3m)",
      light: "Medium Indirect Light",
      humidity: "Moderate to High (60-80%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Easy to Moderate",
      growthSpeed: "Moderate to Fast"
    },
    morphology: {
      leafShape: "Deeply pinnatisect, claw-like, distant lobes",
      leafLength: "30-50cm",
      leafWidth: "20-35cm",
      petioleColor: "Green",
      venation: "Pinnate, prominent",
      texture: "Smooth, semi-glossy",
      variegation: "None",
      growthHabit: "Climbing vining stem"
    },
    query: "Philodendron distantilobum",
    filename: "Philodendron distantilobum.png",
    targetFolder: "philodendron"
  },
  {
    name: "Anthurium vittariifolium",
    slug: "vittariifolium",
    scientificName: "Anthurium vittariifolium Sodiro",
    commonName: "Strap-Leaf Anthurium",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Anthurium",
    species: "vittariifolium",
    origin: "Ecuador to Peru",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "££",
    aboutText: "Anthurium vittariifolium is a popular epiphytic species native to the wet forests of Ecuador and Peru. It produces long, narrow, strap-like leaves that hang vertically from the base. The leaves are leathery, dark green, and can reach over a meter in length. It is similar to Anthurium pallidiflorum but distinguished by its slightly thicker texture and distinct seed berries. It is highly valued for its elegant, cascading foliage and makes a beautiful hanging specimen.",
    quickFacts: {
      growthHabit: "Epiphytic, pendant",
      matureSize: "Large pendant (leaves 60-120cm)",
      light: "Medium Indirect Light",
      humidity: "High (70-85%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Easy to Moderate",
      growthSpeed: "Moderate"
    },
    morphology: {
      leafShape: "Linear-lanceolate, strap-like, pendant",
      leafLength: "60-120cm",
      leafWidth: "5-8cm",
      petioleColor: "Green, short",
      venation: "Prominent midrib",
      texture: "Leathery, matte to semi-glossy",
      variegation: "None",
      growthHabit: "Pendant epiphytic rosette"
    },
    query: "Anthurium vittariifolium",
    filename: "Anthurium vittariifolium.png",
    targetFolder: "anthurium"
  },
  {
    name: "Anthurium warocqueanum",
    slug: "warocqueanum",
    scientificName: "Anthurium warocqueanum T.Moore",
    commonName: "Queen Anthurium",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Anthurium",
    species: "warocqueanum",
    origin: "Colombia",
    collectorPopularity: 5,
    rarityStatus: "Very Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Anthurium warocqueanum, widely known as the 'Queen Anthurium', is one of the most iconic and highly coveted species in the aroid hobby. Native to the extremely humid rainforests of Colombia, it produces massive, elongated, velvet-textured leaves that can grow up to 1.2 meters long. The leaves are dark green to almost black, contrasted by striking silvery-white primary veins. Due to its thin, velvety leaves, it requires high humidity and careful moisture levels, but remains a crown jewel for collectors.",
    quickFacts: {
      growthHabit: "Epiphytic, compact to climbing",
      matureSize: "Large (leaves 60-120cm long)",
      light: "Medium Indirect Light",
      humidity: "Very High (75-95%)",
      temperature: "Intermediate to Warm (16-26°C)",
      difficulty: "Hard",
      growthSpeed: "Slow to Moderate"
    },
    morphology: {
      leafShape: "Elongated cordate-sagittate, narrow sinus",
      leafLength: "60-120cm",
      leafWidth: "15-25cm",
      petioleColor: "Green, round",
      venation: "Striking silvery-white primary veins",
      texture: "Thick, velvety, matte",
      variegation: "None",
      growthHabit: "Basal rosette to slowly climbing"
    },
    query: "Anthurium warocqueanum",
    filename: "Anthurium warocqueanum.png",
    targetFolder: "anthurium"
  },
  {
    name: "Alocasia princeps",
    slug: "princeps",
    scientificName: "Alocasia princeps W.Bull",
    commonName: "Princeps Shield Alocasia",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Alocasia",
    species: "princeps",
    origin: "Borneo",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Alocasia princeps is a handsome, rare Alocasia species native to Borneo. It features erect, triangular, shield-shaped (sagittate) leaves with strongly undulated, wavy margins and deep purplish-green to copper undersides. The petioles are often beautifully mottled or striped. It grows from a central corm, forming an upright, architectural clump. It thrives in high humidity and bright indirect light, adding a regal, sculptural presence to any collection.",
    quickFacts: {
      growthHabit: "Erect, clump-forming",
      matureSize: "Medium (40-60cm)",
      light: "Medium to bright indirect light",
      humidity: "High (70-85%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Moderate",
      growthSpeed: "Slow to Moderate"
    },
    morphology: {
      leafShape: "Sagittate, triangular, wavy margins",
      leafLength: "25-40cm",
      leafWidth: "15-25cm",
      petioleColor: "Mottled purplish-brown and green",
      venation: "Prominent green",
      texture: "Coriaceous, matte to semi-glossy",
      variegation: "None",
      growthHabit: "Upright basal clump"
    },
    query: "Alocasia princeps",
    filename: "Alocasia princeps.png",
    targetFolder: "alocasia"
  },
  {
    name: "Rhaphidophora latevaginata",
    slug: "rhaphidophora-latevaginata",
    scientificName: "Rhaphidophora latevaginata M.Hotta",
    commonName: "Latevaginata Shingling Aroid",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Rhaphidophora",
    species: "latevaginata",
    origin: "Borneo",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Rhaphidophora latevaginata is a highly specialized shingling aroid native to the tropical rainforests of Borneo. In its juvenile stage, it shingles closely and flat against its support, producing round, heart-shaped, overlapping leaves that are medium green and slightly leathery. As it climbs high into the canopy, it develops larger, elongated leaves with a distinct petiole sheath. It is a stunning climber that thrives in high humidity and warm temperatures with a wood plank or pole to shingle on.",
    quickFacts: {
      growthHabit: "Shingling to root-climbing climber",
      matureSize: "Medium climber (1.5-2.5m)",
      light: "Medium Indirect Light",
      humidity: "High (70-85%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Moderate",
      growthSpeed: "Slow to Moderate"
    },
    morphology: {
      leafShape: "Asymmetric heart-shaped, shingling",
      leafLength: "8-15cm (juvenile)",
      leafWidth: "6-12cm",
      petioleColor: "Green, short",
      venation: "Pinnate, inconspicuous",
      texture: "Leathery, matte",
      variegation: "None",
      growthHabit: "Shingling flat against support"
    },
    query: "Rhaphidophora latevaginata",
    filename: "Rhaphidophora latevaginata.png",
    targetFolder: "other"
  },
  {
    name: "Scindapsus treubii",
    slug: "scindapsus-treubii",
    scientificName: "Scindapsus treubii Engl.",
    commonName: "Treubii Moonlight",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Scindapsus",
    species: "treubii",
    origin: "Malaysia, Sumatra, Java, Borneo",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "££",
    aboutText: "Scindapsus treubii is a classic, highly elegant climbing species native to the tropical rainforests of Southeast Asia. Known commonly as 'Treubii Moonlight' or 'Treubii Dark Form' depending on the selection, the wild species features thick, lance-shaped leaves with a smooth, leathery texture and a gorgeous dark green to silver-green sheen. It climbs up supports using adventitious roots at the nodes and is very easy to grow in home conditions, tolerating lower humidity than other rare aroids.",
    quickFacts: {
      growthHabit: "Root-climbing climber",
      matureSize: "Medium climber (1.5-3m)",
      light: "Medium Indirect Light",
      humidity: "Moderate to High (50-75%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Easy",
      growthSpeed: "Slow to Moderate"
    },
    morphology: {
      leafShape: "Lanceolate, falcate (curved)",
      leafLength: "12-22cm",
      leafWidth: "5-10cm",
      petioleColor: "Green, sheathing",
      venation: "Subtle",
      texture: "Thick, leathery, smooth, satin sheen",
      variegation: "None (or silver sheen)",
      growthHabit: "Climbing vining stem"
    },
    query: "Scindapsus treubii",
    filename: "Scindapsus treubii.png",
    targetFolder: "other"
  },
  {
    name: "Amydrium sinense",
    slug: "amydrium-sinense",
    scientificName: "Amydrium sinense (H.Li) H.Li",
    commonName: "Chinese Amydrium",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Amydrium",
    species: "sinense",
    origin: "China (Yunnan, Guangxi, Guangdong) to Vietnam",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Amydrium sinense is a rare creeping or climbing aroid species native to the subtropical and tropical mountain forests of southern China and northern Vietnam. It grows in shaded, damp forest floors, creeping or climbing trees. The leaves are deeply divided (pinnate-split) into several narrow lobes, giving it a delicate, skeleton-like appearance. It is highly valued for its cold tolerance compared to equatorial species and its highly architectural, lacey foliage.",
    quickFacts: {
      growthHabit: "Creeping to root-climbing climber",
      matureSize: "Medium climber (1.5-2.5m)",
      light: "Medium to Low Indirect Light",
      humidity: "High (65-80%)",
      temperature: "Subtropical to Warm (12-25°C)",
      difficulty: "Moderate",
      growthSpeed: "Slow to Moderate"
    },
    morphology: {
      leafShape: "Deeply divided, pinnatifid",
      leafLength: "20-40cm",
      leafWidth: "15-28cm",
      petioleColor: "Green, slender",
      venation: "Reticulate",
      texture: "Smooth, matte to semi-glossy",
      variegation: "None",
      growthHabit: "Creeping stems, rooting at nodes"
    },
    query: "Amydrium sinense",
    filename: "Amydrium sinense.png",
    targetFolder: "other"
  },
  {
    name: "Epipremnum giganteum",
    slug: "epipremnum-giganteum",
    scientificName: "Epipremnum giganteum (Roxb.) Schott",
    commonName: "Giant Epipremnum",
    statusTag: "Rare Species",
    botanicalType: "species",
    family: "Araceae",
    genus: "Epipremnum",
    species: "giganteum",
    origin: "Indochina to Malaysia",
    collectorPopularity: 4,
    rarityStatus: "Rare",
    availability: "Low",
    priceGuideTier: "£££",
    aboutText: "Epipremnum giganteum is a massive, climbing liana native to the monsoon and tropical wet forests of Indochina and Malaysia. In its natural habitat, it climbs tall trees using strong aerial roots, producing massive, undivided, paddle-shaped leaves that can reach over a meter long. The leaves are thick, leathery, and dark green with a leathery texture. It is a highly robust grower that requires a very sturdy support or tree trunk to reach its potential, making a magnificent statement piece.",
    quickFacts: {
      growthHabit: "Root-climbing climber",
      matureSize: "Large climber (3-6m)",
      light: "Bright Indirect Light",
      humidity: "Moderate to High (50-80%)",
      temperature: "Warm (18-28°C)",
      difficulty: "Easy",
      growthSpeed: "Fast"
    },
    morphology: {
      leafShape: "Elongated oblong-elliptic, paddle-like, entire",
      leafLength: "60-120cm",
      leafWidth: "20-40cm",
      petioleColor: "Green, thick",
      venation: "Prominent pale midrib",
      texture: "Thick, leathery (coriaceous)",
      variegation: "None",
      growthHabit: "Thick vining stem, root climber"
    },
    query: "Epipremnum giganteum",
    filename: "Epipremnum giganteum.png",
    targetFolder: "other"
  }
];

// Let's loop through and write files
for (const p of plants) {
  const destDir = path.join(contentPlantsRoot, p.targetFolder);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const jsonPath = path.join(destDir, `${p.slug}.json`);
  const pngPath = path.join(destDir, `${p.slug}.png`);
  const srcPngPath = path.join(sourceDir, p.filename);

  // Ensure that for "other" genus, the slug is prefixed with the actual plant genus in the output json slug as well!
  let slugInJson = p.slug;
  if (p.targetFolder === "other") {
    const actualGenus = p.genus.toLowerCase();
    if (!slugInJson.startsWith(actualGenus)) {
      slugInJson = `${actualGenus}-${slugInJson}`;
    }
  }

  const plantData = {
    name: p.name,
    slug: slugInJson,
    scientificName: p.scientificName,
    commonName: p.commonName,
    statusTag: p.statusTag,
    botanicalType: p.botanicalType,
    family: p.family,
    genus: p.genus,
    species: p.species,
    origin: p.origin,
    collectorPopularity: p.collectorPopularity,
    rarityStatus: p.rarityStatus,
    availability: p.availability,
    priceGuideTier: p.priceGuideTier,
    aboutText: p.aboutText,
    quickFacts: p.quickFacts,
    morphology: p.morphology,
    marketMetrics: {
      currentMedianPriceGBP: null,
      threeMonthChangePercent: null,
      marketStatus: null
    },
    priceTracking: {
      enabled: true,
      source: "soldcomps",
      marketplace: "ebay.co.uk",
      query: p.query,
      requiredTerms: [],
      acceptedTerms: [
        p.name,
        p.scientificName,
        p.commonName,
        `${p.genus} ${p.species}`,
        `${p.genus} ${p.species} plant`
      ],
      excludeTerms: [
        "seeds", "seed", "bulb", "rhizome", "corm", "poster", "print",
        "book", "magazine", "care guide", "artificial", "fake", "plastic",
        "silk", "soil", "perlite", "fertiliser", "fertilizer", "moss pole",
        "pot only", "label", "tag", "cutting board"
      ],
      marketCurrency: "GBP"
    },
    recommendedPlants: []
  };

  fs.writeFileSync(jsonPath, JSON.stringify(plantData, null, 2), "utf-8");
  console.log(`Wrote JSON to ${jsonPath}`);

  if (fs.existsSync(srcPngPath)) {
    fs.copyFileSync(srcPngPath, pngPath);
    console.log(`Copied PNG to ${pngPath}`);
  } else {
    console.log(`WARNING: PNG not found at ${srcPngPath}`);
  }
}

console.log("Offline page generation complete!");
