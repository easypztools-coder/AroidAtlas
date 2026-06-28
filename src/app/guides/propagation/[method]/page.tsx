import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

interface GuideStep {
  title: string;
  detail: string;
}

interface PropagationGuide {
  title: string;
  subtitle: string;
  description: string;
  bestFor: string[];
  equipment: string[];
  steps: GuideStep[];
  tips: string[];
  mistakes: string[];
}

const GUIDES: Record<string, PropagationGuide> = {
  "stem-cutting": {
    title: "Stem Cutting Propagation",
    subtitle: "The most reliable method for climbing aroids",
    description:
      "Stem cuttings are the go-to propagation method for most climbing aroids — philodendrons, monsteras, and many others. You take a section of stem that includes at least one node (the point where a leaf attaches) and encourage it to produce roots. Done correctly, the new plant is genetically identical to the parent, preserving any variegation or cultivar characteristics.",
    bestFor: [
      "Philodendrons (all climbing species)",
      "Monstera species",
      "Rhaphidophora and Scindapsus",
      "Most hemiepiphytic aroids",
    ],
    equipment: [
      "Sharp, sterilised scissors or pruning shears (wipe with isopropyl alcohol)",
      "Moist sphagnum moss or perlite — or a glass of clean water for water propagation",
      "A propagation box or clear plastic bag to maintain humidity",
      "Optional: rooting hormone powder or gel",
      "A small pot with well-draining substrate for potting up",
    ],
    steps: [
      {
        title: "Identify a healthy section of stem",
        detail:
          "Select a stem with at least one healthy node and ideally one established leaf. Avoid stems showing signs of pest damage, rot, or disease. For variegated plants, choose a section with good variegation expression.",
      },
      {
        title: "Make a clean cut",
        detail:
          "Cut 1–2 cm below a node using sterilised scissors. A clean cut reduces the risk of infection. You can take a single-node cutting or a multi-node section — both work, though a single node is more efficient if the parent plant is valuable.",
      },
      {
        title: "Let the cut callous",
        detail:
          "Allow the cut end to dry in open air for 30–60 minutes. This reduces the chance of rot at the cut surface before rooting begins.",
      },
      {
        title: "Place in rooting medium",
        detail:
          "For sphagnum moss: wrap the node in moist (not wet) sphagnum and seal in a clear bag or propagation box. For water propagation: submerge the node in clean water ensuring the node is covered but the leaf is not. Change water every 3–4 days.",
      },
      {
        title: "Maintain warmth and humidity",
        detail:
          "Keep the cutting at 20–26°C with high humidity (70%+). Bottom heat from a seedling heat mat significantly accelerates rooting. Place in bright indirect light — never direct sun on an unrooted cutting.",
      },
      {
        title: "Wait for roots to establish",
        detail:
          "Roots typically emerge in 3–8 weeks depending on species and conditions. Wait until roots are at least 2–3 cm long before potting up. Roots produced in sphagnum or water are often fragile — handle gently when transitioning to substrate.",
      },
      {
        title: "Pot up into substrate",
        detail:
          "Move the rooted cutting into a well-draining aroid mix. Water lightly and maintain high humidity for the first 2–4 weeks while the plant transitions to substrate feeding.",
      },
    ],
    tips: [
      "Bottom heat (22–25°C at the base of the cutting) is the single biggest accelerator of rooting speed",
      "Semi-hydro (leca or passive hydroponics) is excellent for rooting cuttings as it eliminates overwatering risk",
      "For rare or expensive plants, air layering on the parent before cutting is safer — roots are established before separation",
      "Rooting hormone is beneficial but not essential for most aroids",
    ],
    mistakes: [
      "Taking a cutting with no node — a leaf alone cannot produce new growth",
      "Keeping the cutting too wet, which causes the cut end to rot before rooting",
      "Placing the cutting in direct sun, which stresses an already vulnerable plant",
      "Potting up too early before roots are sufficiently established",
    ],
  },

  "node-cutting": {
    title: "Node Cutting Propagation",
    subtitle: "Maximising propagation from valuable plants",
    description:
      "A node cutting is a minimal stem cutting that takes just one node — the joint where a leaf attaches to the stem — sometimes with no leaf at all. This technique lets you get the maximum number of cuttings from a single plant and is especially valuable when working with rare or expensive specimens where losing the parent would be costly. The node alone contains all the genetic material needed to produce a full new plant.",
    bestFor: [
      "Philodendrons — particularly expensive variegated forms",
      "Monstera — widely used for Thai Constellation and Albo cuttings",
      "Any climbing aroid where maximising yield from the parent plant is important",
    ],
    equipment: [
      "Very sharp, sterilised blade (scalpel or razor blade preferred over scissors)",
      "Moist sphagnum moss",
      "Clear propagation box or zip-lock bag",
      "Seedling heat mat (strongly recommended)",
      "Rooting hormone (more beneficial for leafless nodes than for standard stem cuttings)",
    ],
    steps: [
      {
        title: "Identify each node on the stem",
        detail:
          "Nodes are visible as slight thickenings or joints along the stem, typically where a leaf or petiole attaches. Each node has the potential to produce a new plant.",
      },
      {
        title: "Cut between nodes",
        detail:
          "Using a sterilised blade, cut the stem between nodes to isolate individual node sections. Leave at least 1 cm of stem above and below each node. Sterilise the blade between each cut to prevent cross-contamination.",
      },
      {
        title: "Apply rooting hormone",
        detail:
          "Dip or dust the cut surfaces with rooting hormone. This is more important for leafless nodes than for stem cuttings with leaves, as leafless nodes have less stored energy to initiate rooting.",
      },
      {
        title: "Embed in sphagnum and seal",
        detail:
          "Nestle each node in moist sphagnum moss so the node is in contact with the medium but not buried. Seal in a clear propagation box. Label each cutting if you're propagating multiple species or variations.",
      },
      {
        title: "Provide warmth, humidity and patience",
        detail:
          "Maintain 22–26°C with humidity above 75%. Bottom heat is especially important for leafless nodes as they have no leaf to photosynthesise energy for root production. Check every 7–10 days for signs of rot or new growth.",
      },
      {
        title: "Watch for growth",
        detail:
          "Leafless nodes will first produce a small bud or eye before roots emerge. The sequence is typically: bud swells → first leaf unfurls → roots develop. This can take 6–16 weeks. Do not disturb during this process.",
      },
      {
        title: "Pot up when roots are established",
        detail:
          "Once 2–4 cm roots have developed and the first leaf has fully unfurled, carefully pot into a well-draining substrate. Handle roots gently — sphagnum-grown roots are fragile.",
      },
    ],
    tips: [
      "Nodes can be stored in dry sphagnum at 18–20°C for short periods if you can't propagate immediately",
      "A node with a visible aerial root stub already attached will root faster than a clean node",
      "Label everything meticulously — nodes from different plants look identical",
      "Higher temperatures (24–26°C) significantly speed up the process compared to cooler conditions",
    ],
    mistakes: [
      "Cutting nodes too thin — leaving insufficient stem means the node can't support itself in the medium",
      "Over-saturating the sphagnum, which causes rot at the cut surfaces",
      "Checking too frequently — opening the propagation box repeatedly introduces pathogens and disrupts the humid environment",
      "Giving up too soon — leafless nodes routinely take 10–16 weeks, which is normal",
    ],
  },

  "leaf-cutting": {
    title: "Leaf Cutting Propagation",
    subtitle: "The begonia specialist's method",
    description:
      "Leaf cuttings are the primary propagation method for rhizomatous begonias and a handful of other genera. Unlike stem cuttings, you use the leaf itself — either as a whole leaf, a leaf section, or via the petiole (leaf stalk). Tiny plantlets emerge from the cut margins or veins of the leaf and can be separated once large enough. It's a remarkably effective method that can produce dozens of plants from a single leaf.",
    bestFor: [
      "Rhizomatous begonias — the most reliable method",
      "Rex begonia cultivars — leaf sections produce many plantlets",
      "Some succulents (not covered here)",
    ],
    equipment: [
      "Sharp, sterilised blade or scissors",
      "Shallow tray or propagation box",
      "Moist propagation medium: 50/50 perlite and coco coir works well",
      "Clear lid or cling film to maintain humidity",
      "Warm, bright location (no direct sun)",
    ],
    steps: [
      {
        title: "Select a healthy, mature leaf",
        detail:
          "Choose a fully developed, healthy leaf. Avoid damaged, old, or very young leaves. The leaf should be firm and free from pest damage or disease.",
      },
      {
        title: "Choose your method: whole leaf, sections, or petiole",
        detail:
          "Whole leaf: place the entire leaf flat on the medium and make shallow cuts across each main vein. Leaf sections: cut the leaf into sections 3–5 cm across, each including a main vein. Petiole: insert just the petiole (leaf stalk) into the medium at a 45° angle.",
      },
      {
        title: "Prepare the medium",
        detail:
          "Fill a shallow tray with moist (not wet) propagation medium. It should hold moisture but not be waterlogged — squeeze a handful and only a few drops should emerge.",
      },
      {
        title: "Place or insert the cutting",
        detail:
          "For whole leaves: lay flat on the surface and pin or weigh down lightly so veins contact the medium. For sections: insert the cut edge into the medium. For petioles: push the stem 2–3 cm into the medium.",
      },
      {
        title: "Seal and maintain humidity",
        detail:
          "Cover with a clear lid or cling film to maintain 70%+ humidity. Place in bright indirect light at 20–24°C. The leaf should not wilt — if it does, increase humidity.",
      },
      {
        title: "Watch for plantlets",
        detail:
          "Tiny plantlets emerge at cut vein margins within 4–10 weeks. They will be very small initially — allow them to develop 2–3 true leaves before separating.",
      },
      {
        title: "Separate and pot up",
        detail:
          "Carefully separate individual plantlets once they have 2–3 leaves, handling by the leaf rather than the stem. Pot individually into a light, free-draining begonia mix.",
      },
    ],
    tips: [
      "Begonias root fastest at 22–24°C — a heat mat under the tray speeds things up considerably",
      "Whole leaf method with vein cuts produces the most plantlets from a single leaf",
      "Misting rather than watering prevents disturbing the delicate medium surface",
      "Don't remove the parent leaf until it has fully dried — it feeds the plantlets until they are independent",
    ],
    mistakes: [
      "Using too wet a medium — the leaf base or cut edges will rot before plantlets emerge",
      "Removing the parent leaf too early — plantlets need it for stored energy",
      "Placing in direct sun — the leaf will scorch and die before plantlets emerge",
      "Not making cuts across the veins on whole leaves — plantlets only emerge from cut vein surfaces",
    ],
  },

  "rhizome-division": {
    title: "Rhizome Division",
    subtitle: "Dividing crawling aroids at the rhizome",
    description:
      "Rhizome division is used for aroids that grow from a horizontal stem (rhizome) at or just below the soil surface, rather than climbing upright. Philodendron gloriosum, sodiroi, and related species all grow this way. Division involves cutting the rhizome into sections, each with at least one growing point or node, and establishing each section separately. It's a reliable method but requires a mature, multi-stemmed plant and good aftercare.",
    bestFor: [
      "Philodendron gloriosum, sodiroi, pastazanum and related crawling species",
      "Mature plants with multiple growing points along the rhizome",
    ],
    equipment: [
      "Sharp, sterilised blade (a clean knife is better than scissors for rhizomes)",
      "Fungicide powder or cinnamon to dust cut surfaces",
      "Fresh well-draining substrate",
      "Wide, shallow pots — suited to crawling root systems",
      "Clear bag or propagation box for aftercare",
    ],
    steps: [
      {
        title: "Wait for the right time",
        detail:
          "Divide in spring or early summer when the plant is actively growing. Avoid dividing in winter when the plant's energy reserves are low and recovery is slow.",
      },
      {
        title: "Remove the plant from its pot",
        detail:
          "Gently remove the plant and shake loose most of the substrate. You want to see the full rhizome structure clearly before cutting.",
      },
      {
        title: "Identify division points",
        detail:
          "Look for sections of rhizome that have their own visible growing tip (a point from which new leaves emerge) or dormant bud. Each division must include at least one growing point to succeed.",
      },
      {
        title: "Make clean cuts",
        detail:
          "Using a sterilised blade, cut firmly through the rhizome at a point between growing sections. A single clean cut is better than sawing, which can cause more tissue damage.",
      },
      {
        title: "Treat the cut surfaces",
        detail:
          "Dust each cut surface with cinnamon or sulphur-based fungicide powder. Allow to callous in open air for 30–60 minutes before potting.",
      },
      {
        title: "Pot each division",
        detail:
          "Pot each division into fresh substrate in a wide, shallow container. The rhizome should sit at or just below the surface — do not bury deeply. Water lightly.",
      },
      {
        title: "Maintain high humidity during recovery",
        detail:
          "Divisions often sulk for 2–6 weeks before producing new growth. Maintain 65–75% humidity and avoid overwatering during this period. New leaves are a sign of successful establishment.",
      },
    ],
    tips: [
      "Never divide a struggling plant — only healthy, established specimens recover well from division",
      "Larger divisions (2+ growing points) establish faster than minimal single-node sections",
      "Cinnamon is an effective natural antifungal for treating cut surfaces",
      "A heat mat helps prevent shock during recovery — keep at 22–24°C",
    ],
    mistakes: [
      "Dividing in winter when the plant has reduced vigour",
      "Cutting through or too close to a growing tip — this delays or prevents recovery",
      "Overwatering freshly divided plants whose roots are reduced and cannot absorb excess moisture",
      "Burying the rhizome too deep, which encourages rot",
    ],
  },

  "offsets-and-pups": {
    title: "Offsets, Pups & Keikis",
    subtitle: "Propagating from natural offshoots",
    description:
      "Many aroids produce natural offshoots — called pups, offsets, or in the case of anthuriums, keikis — that can be separated from the mother plant and grown on independently. This is the primary propagation method for alocasias (which produce corms and pups) and anthuriums (which occasionally produce basal offshoots). It's one of the most reliable propagation routes because the offset already has its own developing root system before separation.",
    bestFor: [
      "Alocasia — all species regularly produce corms and pups",
      "Anthurium — mature velvet-leaf types occasionally produce keikis",
      "Any aroid that naturally produces side growth from the base",
    ],
    equipment: [
      "Sharp, sterilised blade or scissors",
      "Fresh well-draining substrate",
      "Small pots appropriate to the size of the offset",
      "Optional: rooting hormone for offsets with limited root development",
      "Propagation box or clear bag for undeveloped corms",
    ],
    steps: [
      {
        title: "Wait for the offset to develop",
        detail:
          "For alocasia pups: wait until the pup has at least one small leaf emerging before separating — a leaf indicates it has begun photosynthesising independently. For corms: small green or brown corm-like structures can be separated even without a leaf. For anthurium keikis: wait until the keiki has 2–3 small leaves and visible roots.",
      },
      {
        title: "Remove the mother plant from its pot",
        detail:
          "Carefully remove the plant and gently shake off substrate to expose the base and any offsets. Alocasia pups will be connected to the mother by a thin stolon or corm; anthurium keikis emerge from the base of the stem.",
      },
      {
        title: "Separate carefully",
        detail:
          "Use a sterilised blade to cut between the offset and the mother plant. Aim to keep as many roots on the offset as possible. For corms with no roots, a clean separation is fine.",
      },
      {
        title: "Treat cut surfaces",
        detail:
          "Dust cut surfaces on both the offset and the mother plant with cinnamon or fungicide powder. Allow to callous briefly before potting.",
      },
      {
        title: "Pot the offset",
        detail:
          "For offsets with roots: pot directly into fresh substrate. For bare corms: half-bury in moist sphagnum and place in a warm, humid propagation box. The corm will produce roots and a leaf in 4–10 weeks.",
      },
      {
        title: "Aftercare",
        detail:
          "Keep newly separated offsets at high humidity (65–75%) for 4–6 weeks. Water lightly — their root system is small and overwatering is a significant risk. New leaf production indicates successful establishment.",
      },
    ],
    tips: [
      "Alocasia corms can be collected when repotting even if no pup has yet emerged — stored in slightly damp sphagnum at room temperature, many will sprout",
      "Mother plants actually tend to produce more pups after separation, as if encouraged by the division",
      "Anthurium keikis are rare and valuable — wait as long as possible before separating to maximise their root development",
      "Variegated alocasia pups should show variegation from their first leaf — a completely green pup may not carry the trait",
    ],
    mistakes: [
      "Separating pups before they have any leaf development — leafless pups without roots have very little stored energy to survive",
      "Overwatering small offsets whose root systems cannot handle excess moisture",
      "Burying alocasia corms completely — they should be partially exposed to light",
      "Discarding small or dormant-looking corms — these often sprout after weeks of patient waiting",
    ],
  },

  "air-layering": {
    title: "Air Layering",
    subtitle: "Rooting on the parent plant before separation",
    description:
      "Air layering is the safest propagation method for rare or expensive aroids — roots are developed while the cutting is still attached to and being fed by the parent plant. Only after a healthy root system has formed is the cutting removed. The result is a much higher success rate than standard stem cuttings, at the cost of a little more preparation. It's particularly recommended for Philodendron spiritus-sancti and other plants where losing a cutting would be a significant financial loss.",
    bestFor: [
      "Rare or expensive climbing aroids where cutting failure would be costly",
      "Philodendron spiritus-sancti, patriciae, and other slow-growing species",
      "Plants with thick stems that root more reluctantly than typical aroids",
      "Any climbing aroid where you want near-guaranteed success",
    ],
    equipment: [
      "Sharp, sterilised blade",
      "Moist sphagnum moss (thoroughly wetted then squeezed to remove excess water)",
      "Clear plastic film or cling wrap",
      "Zip ties, twist ties, or grafting tape to seal the sphagnum",
      "Rooting hormone (optional but beneficial)",
    ],
    steps: [
      {
        title: "Select a section of stem",
        detail:
          "Choose a healthy section of stem with at least one node, ideally with an aerial root already present. The section should be below a healthy leaf so the plant can continue photosynthesising above the wound.",
      },
      {
        title: "Create a wound",
        detail:
          "Using a sterilised blade, make a shallow upward cut or a ring of removed bark around the stem at the node. The goal is to interrupt the flow of nutrients downward — this triggers root production at the wound site. Do not cut more than halfway through the stem.",
      },
      {
        title: "Apply rooting hormone",
        detail:
          "Dust the wound surface with rooting hormone powder or apply gel directly to the cut. This accelerates root initiation.",
      },
      {
        title: "Pack with moist sphagnum",
        detail:
          "Take a generous handful of moist sphagnum and pack it firmly around the wound site, forming a ball 6–10 cm in diameter. The entire node and wound must be covered and in contact with the sphagnum.",
      },
      {
        title: "Wrap in plastic",
        detail:
          "Wrap the sphagnum ball tightly with clear plastic film, sealing both top and bottom with zip ties or tape. The package must be airtight to maintain moisture. Clear plastic lets you monitor root development without disturbing the setup.",
      },
      {
        title: "Wait for roots",
        detail:
          "Leave undisturbed for 4–12 weeks. You will see roots growing through the sphagnum — wait until roots are 3–5 cm long and clearly visible through the plastic before proceeding.",
      },
      {
        title: "Cut and pot",
        detail:
          "Once roots are established, cut the stem just below the sphagnum ball. Remove the plastic but leave the sphagnum intact around the roots — it will integrate naturally into the potting medium. Pot into a well-draining substrate and maintain high humidity for 2–4 weeks.",
      },
    ],
    tips: [
      "Placing the plant in higher light during air layering speeds up root production by increasing the plant's metabolic activity",
      "If the sphagnum appears to be drying out through the plastic wrap, inject a small amount of water with a syringe through the wrap rather than unwrapping",
      "For the highest-value plants, air layer multiple nodes simultaneously as insurance",
      "The parent plant suffers minimal stress and will often push new growth from below the wound",
    ],
    mistakes: [
      "Not wounding deeply enough — a superficial cut may not trigger root initiation",
      "Using sphagnum that is too wet — waterlogged sphagnum encourages rot rather than rooting",
      "Cutting the stem before roots are fully established — wait until you can see a good root mass, not just the first hairlike roots",
      "Not sealing the plastic completely — moisture loss dramatically slows root production",
    ],
  },

  "seed-propagation": {
    title: "Seed Propagation",
    subtitle: "Growing aroids from seed",
    description:
      "Propagating aroids from seed is a slow, rewarding route to new plants — but with important caveats. Aroid seeds are short-lived and must be sown fresh (within days or weeks of harvest for most species). Seeds from hybrid plants or cultivars will not produce identical offspring — only vegetative methods preserve cultivar characteristics. Seed propagation is most useful for growing species-true plants in large quantities, or for breeding projects.",
    bestFor: [
      "Species aroids (non-hybrid, non-cultivar) where variation from seed is acceptable",
      "Collectors interested in breeding or producing seedlings from known parent crosses",
      "Anthurium species — often easier to source fresh seed than established plants",
    ],
    equipment: [
      "Very fresh seed (aroid seed viability drops rapidly — sow within days of harvest where possible)",
      "A shallow seed tray or small pots",
      "Light, moisture-retaining seed compost: 50% coco coir, 30% perlite, 20% vermiculite",
      "Clear propagation dome or cling film",
      "Seedling heat mat",
      "Gentle fungicide (chamomile tea or dilute copper solution) to prevent damping off",
    ],
    steps: [
      {
        title: "Source or collect fresh seed",
        detail:
          "Aroid seeds lose viability rapidly when dry. If purchasing seed, buy only from reputable sellers who ship fresh (not dried) seed. For home-collected seed, harvest berries once fully ripe and extract seeds immediately.",
      },
      {
        title: "Clean the seeds",
        detail:
          "Rinse seeds in clean water to remove the gel-like coating on the berry. This coating inhibits germination. Sow immediately — do not allow seeds to dry out.",
      },
      {
        title: "Prepare the seed tray",
        detail:
          "Moisten the seed compost until evenly damp. Fill the tray to within 1 cm of the top. Firm gently but do not compact.",
      },
      {
        title: "Sow on the surface",
        detail:
          "Place seeds on the surface of the compost — do not bury deeply. Most aroid seeds germinate best with light access. Space seeds 2–3 cm apart to allow room for initial growth.",
      },
      {
        title: "Cover and maintain conditions",
        detail:
          "Cover with a clear dome or cling film. Maintain 24–28°C (bottom heat helps significantly) and 80%+ humidity. Place in bright indirect light. Check daily for moisture — the medium should never dry out.",
      },
      {
        title: "Watch for germination",
        detail:
          "Fresh aroid seeds typically germinate within 1–4 weeks. The first structure to emerge is the radicle (root), followed by the first leaf. Germination is often staggered — not all seeds will sprout simultaneously.",
      },
      {
        title: "Prick out and pot up",
        detail:
          "Once seedlings have 2 true leaves and are large enough to handle, carefully prick them out and move into individual small pots. Handle by the leaf, never the stem.",
      },
    ],
    tips: [
      "Fresh is everything — aroid seeds stored dry for more than a few weeks rarely germinate successfully",
      "A very dilute chamomile tea drench at sowing helps prevent damping off (fungal collapse of seedlings)",
      "Seedlings from self-pollinated plants may show high variation — be prepared for unexpected results",
      "Anthurium seedlings grow extremely slowly — patience over many months is essential",
    ],
    mistakes: [
      "Using dried or old seed — the most common reason for failure",
      "Burying seeds too deep, which prevents germination in light-demanding species",
      "Allowing the seed tray to dry out even briefly — aroid seeds abort quickly when desiccated",
      "Expecting cultivar traits to carry through — seed-grown plants from variegated parents are almost always plain green",
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(GUIDES).map((method) => ({ method }));
}

const BASE_URL = "https://aroidatlas.co.uk";

export async function generateMetadata({
  params,
}: {
  params: { method: string };
}): Promise<Metadata> {
  const guide = GUIDES[params.method];
  if (!guide) return { title: "Guide Not Found" };
  const description = guide.description.slice(0, 155);
  const canonicalUrl = `${BASE_URL}/guides/propagation/${params.method}`;
  return {
    title: `${guide.title} — Aroid Propagation Guide`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${guide.title} | Aroid Atlas`,
      description,
      url: canonicalUrl,
      siteName: "Aroid Atlas",
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.title} | Aroid Atlas`,
      description,
    },
  };
}

export default function PropagationGuidePage({
  params,
}: {
  params: { method: string };
}) {
  const guide = GUIDES[params.method];
  if (!guide) notFound();

  const canonicalUrl = `${BASE_URL}/guides/propagation/${params.method}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: guide.title,
        description: guide.description,
        url: canonicalUrl,
        supply: guide.equipment.map((item) => ({
          "@type": "HowToSupply",
          name: item,
        })),
        step: guide.steps.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.title,
          text: step.detail,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Care Guides", item: `${BASE_URL}/learn` },
          { "@type": "ListItem", position: 3, name: "Propagation Guides", item: `${BASE_URL}/learn#propagation` },
          { "@type": "ListItem", position: 4, name: guide.title, item: canonicalUrl },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-muted">
        <Link href="/learn" className="transition-colors hover:text-heading">Care Guides</Link>
        <span className="text-border-strong">/</span>
        <span>Propagation</span>
        <span className="text-border-strong">/</span>
        <span className="text-heading">{guide.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-10 border-b border-border pb-8">
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
          Propagation Guide
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-heading md:text-4xl">
          {guide.title}
        </h1>
        <p className="mt-2 text-base text-muted">{guide.subtitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">{guide.description}</p>
      </div>

      {/* Best for */}
      <section className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-heading">Best For</h2>
        <ul className="space-y-1.5">
          {guide.bestFor.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/50" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Equipment */}
      <section className="mb-8 rounded border border-border bg-background-soft p-5">
        <h2 className="mb-3 font-heading text-base font-semibold text-heading">What You Need</h2>
        <ul className="space-y-2">
          {guide.equipment.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Steps */}
      <section className="mb-8">
        <h2 className="mb-5 font-heading text-lg font-semibold text-heading">Step by Step</h2>
        <ol className="space-y-5">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/8 font-body text-xs font-bold text-accent">
                {i + 1}
              </span>
              <div className="pt-0.5">
                <p className="mb-1 text-sm font-semibold text-heading">{step.title}</p>
                <p className="text-sm leading-relaxed text-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Tips */}
      <section className="mb-8 rounded border border-leaf/20 bg-leaf/5 p-5">
        <h2 className="mb-3 font-heading text-base font-semibold text-heading">Tips for Success</h2>
        <ul className="space-y-2">
          {guide.tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-sm text-muted">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* Mistakes */}
      <section className="rounded border border-accent/20 bg-accent/5 p-5">
        <h2 className="mb-3 font-heading text-base font-semibold text-heading">Common Mistakes</h2>
        <ul className="space-y-2">
          {guide.mistakes.map((mistake) => (
            <li key={mistake} className="flex items-start gap-2.5 text-sm text-muted">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {mistake}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
