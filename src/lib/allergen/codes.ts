// The predefined allergen list (docs/PLAN.md, Phase 1). These codes must match
// the `public.allergen_code` enum in supabase/migrations exactly; a test
// checks this.

export const ALLERGEN_CODES = [
  "milk",
  "egg",
  "peanut",
  "tree_nuts",
  "soy",
  "wheat_gluten",
  "fish",
  "shellfish",
  "sesame",
  "mustard",
] as const;

export type AllergenCode = (typeof ALLERGEN_CODES)[number];

export const ALLERGEN_LABELS: Record<AllergenCode, string> = {
  milk: "Milk",
  egg: "Egg",
  peanut: "Peanut",
  tree_nuts: "Tree nuts",
  soy: "Soy",
  wheat_gluten: "Wheat / gluten",
  fish: "Fish",
  shellfish: "Shellfish",
  sesame: "Sesame",
  mustard: "Mustard",
};

/**
 * Severity is informational (shown on the emergency card). It must never
 * change a verdict: an Unsafe match is Unsafe whatever the severity.
 */
export const SEVERITIES = ["mild", "moderate", "severe"] as const;

export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_LABELS: Record<Severity, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

export function isAllergenCode(value: string): value is AllergenCode {
  return (ALLERGEN_CODES as readonly string[]).includes(value);
}

export function isSeverity(value: string): value is Severity {
  return (SEVERITIES as readonly string[]).includes(value);
}

// Names that refer to a predefined allergen itself (its label, code, or a
// plain spelling variant). Deliberately NOT a synonym list: "whey" or "dairy"
// are not here. Synonym matching belongs to checkAllergens() in Phase 3.
const PREDEFINED_NAMES: Record<AllergenCode, readonly string[]> = {
  milk: ["milk"],
  egg: ["egg", "eggs"],
  peanut: ["peanut", "peanuts"],
  tree_nuts: ["tree nut", "tree nuts"],
  soy: ["soy", "soya"],
  wheat_gluten: ["wheat", "gluten", "wheat gluten"],
  fish: ["fish"],
  shellfish: ["shellfish"],
  sesame: ["sesame"],
  mustard: ["mustard"],
};

function simplify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * If `name` is just another way of writing one of the predefined allergens
 * (e.g. "Peanuts", "tree_nuts", "Wheat/Gluten"), return its code.
 */
export function findPredefinedByName(name: string): AllergenCode | null {
  const simple = simplify(name);
  if (simple === "") return null;
  for (const code of ALLERGEN_CODES) {
    if (PREDEFINED_NAMES[code].includes(simple)) return code;
  }
  return null;
}
