// Decorative emoji for allergen chips (always aria-hidden, next to the name).
import type { AllergenCode } from "@/lib/allergen/codes";

const EMOJI: Record<AllergenCode, string> = {
  milk: "🥛",
  egg: "🥚",
  peanut: "🥜",
  tree_nuts: "🌰",
  soy: "🫘",
  wheat_gluten: "🌾",
  fish: "🐟",
  shellfish: "🦐",
  sesame: "🌱",
  mustard: "🟡",
};

/** Emoji for a predefined allergen; custom allergens get a neutral marker. */
export function allergenEmoji(selection: { kind: "predefined"; code: AllergenCode } | { kind: "custom" }): string {
  return selection.kind === "predefined" ? EMOJI[selection.code] : "⚠️";
}
