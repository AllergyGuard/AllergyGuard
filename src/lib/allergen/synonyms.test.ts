import { describe, expect, it } from "vitest";
import { ALLERGEN_CODES } from "./codes";
import {
  ALLERGEN_EXCLUSIONS,
  ALLERGEN_TERMS,
  AMBIGUOUS_TERMS,
  findSynonymTarget,
  termRegex,
} from "./synonyms";

function matches(term: string, text: string): string[] {
  return [...text.matchAll(termRegex(term))].map((m) => m[0]);
}

describe("termRegex", () => {
  it("matches whole words and simple plurals", () => {
    expect(matches("almond", "almonds, almond flakes")).toEqual(["almonds", "almond"]);
    expect(matches("egg", "eggs")).toEqual(["eggs"]);
  });

  it("does not match inside another word", () => {
    expect(matches("egg", "eggplant, nutmeg")).toEqual([]);
    expect(matches("nut", "nutmeg, coconut, doughnut, butternut, peanuts")).toEqual([]);
    expect(matches("wheat", "buckwheat")).toEqual([]);
    expect(matches("malt", "maltodextrin, maltose")).toEqual([]);
  });

  it("lets multi-word terms use spaces or hyphens", () => {
    expect(matches("monkey nut", "monkey-nuts, monkey  nut")).toEqual(["monkey-nuts", "monkey  nut"]);
  });

  it("is a fresh global regex each time", () => {
    const re = termRegex("milk");
    expect(re.global).toBe(true);
    expect(re).not.toBe(termRegex("milk"));
  });
});

describe("synonym data", () => {
  it("has terms for every allergen code, lowercase and without duplicates", () => {
    const seen = new Set<string>();
    for (const code of ALLERGEN_CODES) {
      expect(ALLERGEN_TERMS[code].length).toBeGreaterThan(0);
      for (const term of ALLERGEN_TERMS[code]) {
        expect(term).toBe(term.toLowerCase().trim());
        expect(seen.has(term)).toBe(false);
        seen.add(term);
      }
    }
  });

  it("every exclusion phrase contains a term of its own allergen", () => {
    for (const code of ALLERGEN_CODES) {
      for (const phrase of ALLERGEN_EXCLUSIONS[code] ?? []) {
        const hit = ALLERGEN_TERMS[code].some((t) => termRegex(t).test(phrase));
        expect(hit, `${code}: "${phrase}"`).toBe(true);
      }
    }
  });

  // "nut" may be a tree nut term and an ambiguous term for peanut, but never both for one allergen.
  it("ambiguous terms are not also full synonyms of the allergens they flag", () => {
    for (const group of AMBIGUOUS_TERMS) {
      const all = group.possible.flatMap((c) => ALLERGEN_TERMS[c]);
      for (const pattern of group.patterns) {
        for (const term of all) {
          expect(new RegExp(`^(?:${pattern.source})$`, "u").test(term), `${group.label} vs ${term}`).toBe(
            false,
          );
        }
      }
    }
  });

  it("Indian label terms: maida and atta are wheat, besan is not", () => {
    expect(ALLERGEN_TERMS.wheat_gluten).toEqual(expect.arrayContaining(["maida", "atta"]));
    expect(ALLERGEN_CODES.some((c) => ALLERGEN_TERMS[c].includes("besan"))).toBe(false);
  });
});

describe("findSynonymTarget", () => {
  it.each([
    ["dairy", "milk"],
    ["Whey", "milk"],
    [" casein ", "milk"],
    ["Ghee", "milk"],
    ["paneer", "milk"],
    ["Milk", "milk"],
    ["Peanuts", "peanut"],
    ["groundnut", "peanut"],
    ["Almonds", "tree_nuts"],
    ["nuts", "tree_nuts"],
    ["maida", "wheat_gluten"],
    ["Atta", "wheat_gluten"],
    ["barley", "wheat_gluten"],
    ["prawns", "shellfish"],
    ["tahini", "sesame"],
    ["tofu", "soy"],
  ])("%j → %s", (name, code) => {
    expect(findSynonymTarget(name)).toBe(code);
  });

  it.each(["", "  ", "kiwi", "lupin", "lecithin", "flour", "coconut milk", "cocoa butter", "besan"])(
    "%j → null",
    (name) => {
      expect(findSynonymTarget(name)).toBeNull();
    },
  );
});
