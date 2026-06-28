export interface JournalSection {
  heading: string;
  paragraphs: string[];
}

export interface JournalArticle {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readMinutes: number;
  category: string;
  teaser: string;
  sections: JournalSection[];
}

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: "thaumatophyllum-reclassification",
    title: "Thaumatophyllum: A Reclassification Garden Centres Will Never Accept",
    subtitle: "Philodendron selloum is dead. Long live Thaumatophyllum bipinnatifidum. Nobody in retail has noticed.",
    date: "2024-02-08",
    readMinutes: 5,
    category: "Taxonomy",
    teaser: "In 2018, a paper in Aroideana corrected decades of misclassification and resurrected the genus Thaumatophyllum. Six years on, every B&Q in Britain is still selling you a 'Philodendron selloum'.",
    sections: [
      {
        heading: "A Long Overdue Correction",
        paragraphs: [
          "In 2018, a paper by Cassia Mônica Sakuragui, Simon J. Mayo, and Peter C. Boyce, published in Aroideana — the journal of the International Aroid Society — resurrected the genus Thaumatophyllum from synonymy and reclassified several species previously housed under Philodendron into it. The affected plants include bipinnatifidum, selloum (now understood as a juvenile growth form of bipinnatifidum rather than a species in its own right), xanadu, and a handful of related arborescent species native to South America.",
          "From a botanical standpoint, the reclassification is entirely justified. These plants constitute a distinct clade — the meconostigma section — characterised by their tree-like, self-heading habit, large deeply lobed leaves, and a suite of morphological features that genuinely distinguish them from the hemiepiphytic climbers that most people picture when they hear Philodendron. The molecular evidence supports this. The morphological evidence supports this. It was, as these things go, not a particularly contentious taxonomic revision.",
        ],
      },
      {
        heading: "What This Looks Like in Practice",
        paragraphs: [
          "Walk into any large garden centre in England — any of them — and you will find a pot of Thaumatophyllum bipinnatifidum labelled, with great confidence, Philodendron selloum. Sometimes they go for Philodendron xanadu. Occasionally, in what I can only assume is a fit of complete abandon, someone has written 'Split-Leaf Philodendron' on a wooden stick, which is wrong in three separate ways.",
          "I do not particularly blame the garden centre staff. These plants have been sold under the old names for decades. The common name 'tree philodendron' predates the reclassification by fifty years. And frankly, Thaumatophyllum bipinnatifidum is a mouthful that tests the patience of taxonomists, let alone the person trying to write a label to accompany a £24.99 pot of something that people are largely buying because it looks nice in a corner.",
        ],
      },
      {
        heading: "Why Collectors Should Care",
        paragraphs: [
          "For serious aroid enthusiasts, the reclassification matters for two reasons. First, it correctly signals that these plants have substantially different care needs, growth habits, and cultivation histories from true Philodendron. A Thaumatophyllum bipinnatifidum in a large pot, given adequate root space and time, will develop a proper trunk. It can reach four metres indoors under good conditions. This is behaviour entirely at odds with the hemiepiphytic climbers sitting on the shelf next to it — and treating them identically produces suboptimal results.",
          "Second, it illustrates that botanical taxonomy is a living discipline. The International Aroid Society's journal, Aroideana, is where many of these corrections are first published, and it is worth any serious collector's attention. The classification of Araceae is in ongoing revision as molecular phylogenetics catches up with what morphologists have been suggesting for years. Following it is not pedantry; it is keeping current.",
        ],
      },
      {
        heading: "A Gentle Word on the Garden Centre Specimens",
        paragraphs: [
          "Thaumatophyllum bipinnatifidum is, I want to be clear, a genuinely spectacular plant. A mature specimen in a large pot or planted out in a warm conservatory is an architectural presence that most rare aroids cannot match. It also costs twelve pounds at most DIY superstores and requires essentially no specialist care beyond 'large pot, reasonable light, occasional water.' This is not a criticism. Common does not mean inferior.",
          "But let us at least call it what it is. The genus Thaumatophyllum exists. The reclassification happened. At some point, the trade will catch up — though I would not recommend holding your breath.",
        ],
      },
    ],
  },
  {
    slug: "variegation-science",
    title: "The Alchemy of White: What Variegation Actually Is",
    subtitle: "Monstera albo versus Thai Constellation — same aesthetic, completely different biology, and a price gap that only makes sense once you understand why.",
    date: "2024-01-15",
    readMinutes: 6,
    category: "Science",
    teaser: "The word 'variegated' appears so often in the rare plant market that it has become meaningless. Whether your plant's white patches are stable or chimeral determines everything — from propagation to price to what happens when you cut it in half.",
    sections: [
      {
        heading: "Not All White Is Equal",
        paragraphs: [
          "The word 'variegated' appears so frequently in the rare plant market that it has become almost meaningless. A plant is variegated; therefore it is rare; therefore it is expensive. This chain of reasoning omits the most interesting question, which is why a given plant is variegated — and that answer determines almost everything else: how stable the variegation is, whether it can be reproduced by tissue culture, how it behaves under different light conditions, and — yes — how much you should reasonably pay for it.",
          "There are broadly two mechanisms at work in the plants collectors most commonly encounter. Understanding the difference is not optional if you are spending serious money.",
        ],
      },
      {
        heading: "Chimeral Variegation",
        paragraphs: [
          "Monstera deliciosa 'albo-variegata' — the white-sectored form known in the hobby as Monstera albo — is a chimaera. A genetic chimaera, in the botanical sense, is a plant composed of two or more genetically distinct cell populations coexisting in the same organism. In this case, one lineage produces normal green chloroplast-containing cells; the other produces cells with defective plastids that appear white or pale cream. The two populations coexist in the same stem, producing the sectors, half-moon leaves, and occasional all-white growth that collectors pay significant sums to acquire.",
          "The critical implication of this is instability. Chimeral variegation is, by its nature, subject to variation in expression. A heavily variegated section of stem may produce entirely green growth. A green section may produce a splashed leaf. The balance between the two cell populations shifts with every cell division, meaning the plant you buy may not continue to produce the leaves that prompted you to buy it — particularly under conditions of heat stress or excessive light, which tend to shift the balance toward the green population.",
          "Chimeral plants cannot be reliably propagated through tissue culture. Any protocol that forces rapid cell multiplication tends to resolve chimaeras toward one cell type — almost always the green, because it is metabolically dominant and outcompetes the defective cells in conditions of rapid growth. This is why Monstera albo cuttings remain expensive even as the TC market has driven down prices elsewhere: the only propagation route is vegetative, one cutting from one parent plant, which itself took years to establish.",
        ],
      },
      {
        heading: "Stable Variegation and the Thai Constellation",
        paragraphs: [
          "Monstera deliciosa 'Thai Constellation' is something quite different. Its cream-coloured speckles and sectors arise not from a chimeral state but from a stable somatic mutation affecting plastid development across all cell layers simultaneously. Because the mutation is cell-autonomous rather than chimeral, it is heritable, reproducible, and stable across tissue culture. Every cell in the plant carries the same genetic instruction, so cells cannot revert to green — there is no competing green lineage to reassert itself.",
          "The mutation originated in a Thai nursery, most likely in the late 2010s during tissue culture work on Monstera deliciosa. The precise circumstances are not well documented, but the result is a plant with consistent, predictable variegation: cream speckles and sector marks distributed relatively evenly, without the dramatic half-and-half sectors of the albo but without the instability either.",
          "This is why Thai Constellation prices have fallen considerably as tissue culture production scaled. A plant that can be mass-produced reliably will not command prices built on scarcity. Thai Constellation was expensive in 2019 because production capacity was limited. It is affordable now because it is not.",
        ],
      },
      {
        heading: "What to Pay for What",
        paragraphs: [
          "The price premium on chimeral plants — Monstera albo, Philodendron caramel marble, certain variegated Philodendron hastatum forms — is, in part, a legitimate premium on genuine scarcity. Each cutting represents a finite share of what a finite number of parent plants can produce. A heavily variegated specimen is rarer still, because expression at that end of the spectrum is not guaranteed even from a heavily variegated parent.",
          "The price premium on stable, TC-able variegations is a premium on novelty that erodes as supply increases. Both can be worth paying, depending on what you want from the plant. But knowing which you are buying — and understanding why it costs what it does — seems like basic due diligence in a market where single specimens routinely change hands at prices that would embarrass a used car forecourt.",
        ],
      },
    ],
  },
  {
    slug: "pothos-epipremnum",
    title: "Epipremnum aureum: It Was Never a Pothos",
    subtitle: "The most popular houseplant in Britain is not, has never been, and cannot be a pothos. The name stuck from the 19th century and nobody has had the decency to correct it since.",
    date: "2023-11-30",
    readMinutes: 4,
    category: "Taxonomy",
    teaser: "Epipremnum aureum has been wrongly called 'pothos' for 150 years. The actual genus Pothos exists, contains about 70 species, and is none of the things being sold under that name in every garden centre in the country.",
    sections: [
      {
        heading: "The Taxonomy",
        paragraphs: [
          "Epipremnum aureum is not a pothos. It has never been a pothos. It was classified as Pothos aureus in the 19th century, which is where the common name derives, but it was reclassified into the genus Epipremnum by Bunting in 1964. Pothos and Epipremnum are distinct genera — both members of the family Araceae, both from tropical Asia, but morphologically different and belonging to separate taxonomic tribes. Calling Epipremnum aureum a pothos is rather like calling a dolphin a fish: historically understandable, completely wrong, and apparently ineradicable.",
          "The actual genus Pothos, for the curious, contains approximately 70 species of climbing aroids distributed through Southeast Asia and the Pacific. Some turn up occasionally in specialist collections. None of them are the glossy-leaved, trailing plant that every bathroom, office, and student bedsit in Britain appears to contain.",
        ],
      },
      {
        heading: "The Plant Itself",
        paragraphs: [
          "I am trying to be fair. Epipremnum aureum is, within the limits of what it is, a competent houseplant. It tolerates low light — genuinely tolerates it, rather than merely surviving it. It tolerates irregular watering. It tolerates being put in a corner and ignored for extended periods, which is its primary commercial selling point and the reason it appears in more living rooms than any other tropical plant. In warm, well-lit conditions, it can produce leaves of respectable size, and the all-green form occasionally develops incipient fenestration that at least gestures toward something interesting.",
          "The Neon cultivar — which is an aggressively chartreuse green, like a hi-vis jacket decided to become a houseplant — is popular. I find it visually confrontational, but tastes vary.",
        ],
      },
      {
        heading: "What Actually Irritates Me",
        paragraphs: [
          "What I find objectionable is not the plant but the taxonomy vacuum it creates. Epipremnum aureum is universally known by the wrong name, and the wrong name has colonised adjacent territory. Genuine Scindapsus species — which are a different genus entirely, with meaningfully different care requirements — are routinely sold as 'satin pothos.' Philodendron hederaceum gets labelled 'heartleaf pothos.' The actual genus Pothos, should anyone encounter it in a specialist nursery, would probably be labelled something else entirely.",
          "In a hobby where precision matters — where knowing the genus tells you something real about care requirements, humidity tolerance, substrate preference, and growth habit — this taxonomic carelessness has practical consequences. Scindapsus pictus has different needs from Epipremnum aureum. Treating them identically because both are sold under variations of the word 'pothos' produces predictable results.",
        ],
      },
      {
        heading: "Its Proper Place",
        paragraphs: [
          "Epipremnum aureum is a genuinely useful plant for people who want something green and persistent in an environment that would kill most other tropical plants. As a gateway species — introducing people to the family Araceae, creating an appetite for something more interesting — it probably has a net positive effect on the hobby. The NASA Clean Air Study of 1989 identified it as a useful air purifier, though the results have been rather mythologised in the decade since every houseplant retailer discovered that 'air-purifying plant' moves stock.",
          "It is, however, common. It is not rare. It is not interesting in the way that Philodendron gloriosum is interesting, or Anthurium crystallinum is interesting, or any of a hundred other aroids are interesting. Know what it is, use it where it fits, and resist paying more than five pounds for one.",
        ],
      },
    ],
  },
  {
    slug: "obliqua-conspiracy",
    title: "The Obliqua Conspiracy",
    subtitle: "Monstera obliqua is one of the rarest Monstera species in cultivation. What is being sold as obliqua is almost certainly not.",
    date: "2023-10-12",
    readMinutes: 5,
    category: "Taxonomy",
    teaser: "True Monstera obliqua is a cloud-forest species so fenestrated that individual leaves are more hole than blade. It is virtually absent from the hobby. What fills that gap — sold, frequently, at considerable prices — is Monstera adansonii.",
    sections: [
      {
        heading: "What It Actually Is",
        paragraphs: [
          "Monstera obliqua is a genuinely extraordinary plant. Native to a wide swathe of tropical South America — Peru, Colombia, Venezuela, Brazil, Bolivia — it inhabits the deep forest understorey, climbing on host tree trunks in humid valley forests and cloud-forest margins at elevations where moisture is near-constant. First formally described by Miquel in 1847, it is among the most fenestrated members of the entire Monstera genus — not fenestrated in the way that Monstera deliciosa is fenestrated, but fenestrated to a degree that strains belief. In adult specimens, the proportion of hole to blade can exceed ninety percent. The leaf becomes a lacework, a botanical negative space. It is visually remarkable.",
          "I have never grown one. I am not entirely certain that anyone in the mainstream British hobby has grown one either.",
        ],
      },
      {
        heading: "What Is Actually Being Sold",
        paragraphs: [
          "Here is the problem: almost nothing sold under the name Monstera obliqua is Monstera obliqua. What it almost certainly is, instead, is Monstera adansonii — a distinct species, perfectly attractive in its own right and genuinely worth growing, but not obliqua. Adansonii has smaller fenestrations relative to its leaf area, a more compact and vigorous growth habit, and is approximately as rare as tap water. It propagates readily, grows cheerfully across a range of conditions, and commands prices that accurately reflect its abundance: not very much.",
          "The mislabelling in the trade ranges from innocent ignorance — adansonii and obliqua are genuinely easy to confuse from photographs, particularly of juvenile material — to something less charitable. When the asking price for a 'Monstera obliqua' runs to several hundred pounds for a rooted cutting, ignorance becomes harder to accept at face value.",
        ],
      },
      {
        heading: "How to Tell the Difference",
        paragraphs: [
          "True Monstera obliqua has been documented in detail through systematic work at Missouri Botanical Garden, principally through the taxonomic output of Thomas Croat, whose decades of work on neotropical Araceae remains the foundational reference for this genus. Key distinguishing features of adult obliqua: extremely high fenestration-to-blade ratio, leaves that are almost delicate in texture — thin, papery, quite unlike the leathery surface of adansonii — and a growth habit that is notably slow and deliberate, wholly inconsistent with the vigorous climbing plant that fills out a moss pole in a season.",
          "Adansonii, by contrast, has proportionally smaller, more evenly distributed fenestrations, a noticeably thicker and more robust leaf texture, and a growth rate that makes it entirely plausible as a commercial propagation subject. If the plant on offer roots readily, grows quickly, and produces several saleable cuttings per season, it is adansonii. Obliqua does none of these things.",
        ],
      },
      {
        heading: "Why It Matters",
        paragraphs: [
          "Some collectors shrug at this. A plant by any other name and so on — and adansonii is genuinely good value for what it is. But taxonomy encodes real biological and distributional information. When commercial convenience overrides accuracy, that record degrades. More practically, it makes genuinely rare species harder to locate and assess, because their names have been diluted by association with something common.",
          "True Monstera obliqua is unlikely to appear in the mainstream British hobby in meaningful quantities. If it does, it will be expensive, it will grow slowly, and it will take your breath away. In the meantime: if someone is offering you obliqua at a price that seems remotely reasonable, what they are offering you is adansonii. Which is fine. Just use the right name.",
        ],
      },
    ],
  },
  {
    slug: "warocqueanum-market",
    title: "Anthurium warocqueanum: Queen, Casualty, and Comeback",
    subtitle: "Described in 1872, coveted for a century, speculated on for three years, and then repriced by tissue culture. The Queen of Anthuriums has had quite a decade.",
    date: "2023-07-20",
    readMinutes: 6,
    category: "Market Analysis",
    teaser: "Anthurium warocqueanum was changing hands for hundreds of pounds a plant in 2021. Tissue culture arrived, prices collapsed, and the collectors who were in it for the plant — rather than the price tag — are having a rather good time of it now.",
    sections: [
      {
        heading: "The Plant Itself",
        paragraphs: [
          "Anthurium warocqueanum was first described by Thomas Moore in 1872, in The Florist and Pomologist — which tells you something about how long this plant has been captivating people. Native to the rainforests of Colombia, principally the Chocó department and the Urabá and Darién regions along the Pacific and Caribbean coasts, it grows as an epiphyte in humid montane forest at elevations of roughly 800 to 2,000 metres, in conditions of perpetual warmth, constant humidity, and excellent air movement.",
          "What it produces under these conditions is remarkable: pendant, strap-shaped leaves of deep forest green, covered in a dense velvet of microscopic trichomes that give the surface a suede-like quality and cause the light to behave in ways that ordinary glossy leaves cannot manage. Mature leaves can reach a metre and a half in length. The pale veining on some forms becomes more pronounced with maturity and creates a pattern that is, to use the word precisely, extraordinary. If you have only ever seen photographs, the photographs do not fully communicate it.",
        ],
      },
      {
        heading: "The Market Cycle",
        paragraphs: [
          "Between approximately 2019 and 2022, Anthurium warocqueanum was among the most coveted plants in the UK and European collector market. Unrooted cuttings sold for sums that startled. Well-established mother plants changed hands for amounts that made reasonable people uncomfortable. Instagram accounts devoted entirely to warocqueanum accumulated meaningful followings. Some of this was genuine enthusiasm from collectors who understood the plant; a proportion of it was speculative acquisition from people whose primary interest was that prices were rising.",
          "Then tissue culture arrived at meaningful scale. By mid-2023, TC warocqueanum was available from multiple suppliers at prices bearing no resemblance to the 2021 peaks. The repricing was rapid and fairly brutal for those who had bought at the top. A plant purchased for £300 in 2021 might realistically find a buyer at £40 two years later, if it found one at all.",
        ],
      },
      {
        heading: "What Remains After the Correction",
        paragraphs: [
          "The price correction does not change what the plant is. Anthurium warocqueanum remains one of the most visually arresting plants in the family Araceae — full stop, no caveats. The velvet texture, the pendant habit, the progressive intensification of the venation as the plant matures — none of that has changed. What has changed is that the plant is now accessible to collectors who could not previously participate, which is, on balance, a good outcome for the hobby if an uncomfortable one for those holding inventory bought at peak prices.",
          "The horticultural demands are real and should not be understated. Warocqueanum requires genuinely high humidity — 70 percent or above is not a recommendation but a baseline. It needs excellent air circulation to prevent fungal problems that will kill it faster than neglect will. It wants warm, stable temperatures without the fluctuations that normal domestic environments impose. It does not forgive root rot. It does not reward guesswork. It repays precise attention and punishes the assumption that it will accommodate ordinary houseplant care.",
        ],
      },
      {
        heading: "The Current Position",
        paragraphs: [
          "At the time of writing, established Anthurium warocqueanum in the £25–£70 range represents genuinely good value for a plant of exceptional botanical interest and considerable visual impact. The segment of the collector community that remains active with this species has shifted attention toward particular clones — dark forms, large-form selections, plants showing pronounced venation — and toward related velvet-leaf Anthurium species that TC production has not yet reached in volume: forgetii, besseae, dressleri.",
          "Those who came to warocqueanum for the plant rather than the price are, I suspect, enjoying this period rather more than they expected to. An extraordinary plant at an accessible price is not a disappointment. It is simply the market correcting itself.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string): JournalArticle | undefined {
  return JOURNAL_ARTICLES.find((a) => a.slug === slug);
}

export function getSortedArticles(): JournalArticle[] {
  return [...JOURNAL_ARTICLES].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
