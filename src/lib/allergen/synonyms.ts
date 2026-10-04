// Synonyms for the predefined allergens, used by checkAllergens(). Pure data
// and helpers, no network. Terms are matched as whole words (plurals allowed)
// against text from normalizeIngredientText(), so they are lowercase and
// accent-free.

import { findPredefinedByName, type AllergenCode } from "./codes";

/**
 * A match on any of these is Unsafe for that allergen. When in doubt a term
 * goes in: a false Unsafe is an annoyance, a missed allergen is a reaction.
 */
export const ALLERGEN_TERMS: Record<AllergenCode, readonly string[]> = {
  milk: [
    "milk", "dairy", "whey", "casein", "caseinate", "lactose", "lactalbumin",
    "lactoglobulin", "butter", "buttermilk", "butterfat", "ghee", "cream", "cheese",
    "yogurt", "yoghurt", "curd", "paneer", "khoa", "khoya", "dahi", "kefir", "quark",
  ],
  egg: [
    "egg", "yolk", "albumin", "albumen", "ovalbumin", "ovomucoid", "ovovitellin",
    "lysozyme", "meringue", "mayonnaise",
  ],
  peanut: ["peanut", "groundnut", "ground nut", "arachis", "monkey nut", "goober"],
  tree_nuts: [
    "nut", "almond", "cashew", "walnut", "pecan", "hazelnut", "pistachio",
    "macadamia", "chestnut", "filbert", "praline", "marzipan", "frangipane", "gianduja",
  ],
  soy: [
    "soy", "soya", "soybean", "edamame", "tofu", "tempeh", "miso", "natto", "shoyu",
    "tamari", "okara", "yuba",
  ],
  wheat_gluten: [
    "wheat", "gluten", "barley", "rye", "spelt", "kamut", "triticale", "semolina",
    "durum", "couscous", "bulgur", "bulgar", "farina", "seitan", "malt", "einkorn",
    "emmer", "farro", "freekeh", "maida", "atta",
  ],
  fish: [
    "fish", "anchovy", "anchovies", "cod", "salmon", "tuna", "haddock", "hake",
    "pollock", "pollack", "mackerel", "sardine", "pilchard", "herring", "trout",
    "tilapia", "basa", "halibut", "plaice", "bonito", "surimi", "katsuobushi",
  ],
  shellfish: [
    "shellfish", "shrimp", "prawn", "crab", "lobster", "crayfish", "crawfish",
    "langoustine", "scampi", "krill", "mussel", "oyster", "clam", "scallop", "squid",
    "octopus", "cuttlefish", "cockle", "whelk", "abalone",
  ],
  sesame: ["sesame", "tahini", "tahina", "gingelly", "benne", "simsim"],
  mustard: ["mustard"],
};

/**
 * Phrases in which a term does NOT mean that allergen ("cocoa butter" is not
 * milk). A term match that lies entirely inside one of these is ignored for
 * that allergen only: "peanut butter" is still a peanut match.
 */
export const ALLERGEN_EXCLUSIONS: Partial<Record<AllergenCode, readonly string[]>> = {
  milk: [
    "cocoa butter", "shea butter", "mango butter", "kokum butter", "peanut butter",
    "nut butter", "almond butter", "cashew butter", "coconut butter", "butter bean",
    "coconut milk", "coconut cream", "almond milk", "cashew milk", "oat milk",
    "rice milk", "soy milk", "soya milk", "cream of tartar", "bean curd", "milk thistle",
  ],
  egg: ["egg plant", "eggless mayonnaise"],
  tree_nuts: ["monkey nut", "tiger nut", "water chestnut"],
  shellfish: ["oyster mushroom", "crab apple"],
};

export type AmbiguousTerm = {
  /** Shown to the user, e.g. "lecithin may come from soy". */
  label: string;
  /** Matched against normalized text; compiled with the "gu" flags. */
  patterns: readonly RegExp[];
  /** Allergens it might come from. Caution, never Unsafe, while the source is unknown. */
  possible: readonly AllergenCode[];
  /**
   * Non-allergen sources that settle it ("sunflower lecithin", "rice flour").
   * A stated allergen source ("soy lecithin", "flour (wheat)") settles it too,
   * and is matched as Unsafe through ALLERGEN_TERMS.
   */
  sources: readonly string[];
};

const W = "(?<![\\p{L}\\p{N}])";
const END = "(?![\\p{L}\\p{N}])";

/** Terms that only sometimes mean an allergen. */
export const AMBIGUOUS_TERMS: readonly AmbiguousTerm[] = [
  {
    label: "lecithin",
    patterns: [
      new RegExp(`${W}lecithins?${END}`),
      new RegExp(`${W}(?:e|ins)[\\s-]?322${END}`),
      // Indian and Australian labels: "Emulsifiers (322, 471)".
      new RegExp(`(?<=emulsifiers?\\s*[(:][^().;]*?)${W}322(?!\\p{N})`),
    ],
    possible: ["soy"],
    sources: ["sunflower", "rapeseed", "rape", "canola", "corn", "maize"],
  },
  {
    label: "flour",
    patterns: [new RegExp(`${W}flours?${END}`)],
    possible: ["wheat_gluten"],
    sources: [
      "rice", "corn", "maize", "potato", "tapioca", "cassava", "chickpea", "gram",
      "besan", "oat", "buckwheat", "sorghum", "jowar", "bajra", "ragi", "millet",
      "quinoa", "pea", "lentil", "banana", "teff", "amaranth", "arrowroot", "coconut",
      "lupin", "hemp", "cricket",
    ],
  },
  {
    label: "vegetable protein",
    patterns: [new RegExp(`${W}vegetable[\\s-]+proteins?${END}`), new RegExp(`${W}(?:hvp|tvp)${END}`)],
    possible: ["soy", "wheat_gluten"],
    sources: ["pea", "potato", "rice", "corn", "maize"],
  },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Regex source for a whole-word term; words may be split by spaces or hyphens. */
export function termSource(term: string): string {
  const words = term.trim().split(/\s+/).map(escapeRegex);
  const last = words[words.length - 1];
  // "cod" must not match "codes", so only words ending s/x/ch/sh take "es".
  const plural = /(?:s|x|ch|sh)$/.test(last) ? "(?:es)?" : "s?";
  return `${W}${words.join("[\\s-]+")}${plural}${END}`;
}

export function termRegex(term: string): RegExp {
  return new RegExp(termSource(term), "gu");
}

function simplify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}

/**
 * If a custom allergen name is a known synonym of a predefined allergen
 * ("dairy", "whey" → milk; "maida" → wheat_gluten), return that code.
 * Ambiguous terms like "lecithin" return null.
 */
export function findSynonymTarget(name: string): AllergenCode | null {
  const simple = simplify(name);
  if (simple === "") return null;
  const predefined = findPredefinedByName(simple);
  if (predefined) return predefined;
  for (const [code, terms] of Object.entries(ALLERGEN_TERMS) as [AllergenCode, readonly string[]][]) {
    if (terms.some((term) => new RegExp(`^${termSource(term)}$`, "u").test(simple))) return code;
  }
  return null;
}
