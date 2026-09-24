import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  SEVERITIES,
  findPredefinedByName,
  isAllergenCode,
  isSeverity,
} from "./codes";

function enumValues(typeName: string): string[] {
  const dir = join(process.cwd(), "supabase", "migrations");
  const sql = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
  const match = sql.match(
    new RegExp(`create type public\\.${typeName} as enum \\(([^)]*)\\)`, "i"),
  );
  if (!match) throw new Error(`enum ${typeName} not found in migrations`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe("allergen codes", () => {
  it("match the allergen_code enum in the database migration", () => {
    expect([...ALLERGEN_CODES]).toEqual(enumValues("allergen_code"));
  });

  it("severities match the allergen_severity enum", () => {
    expect([...SEVERITIES]).toEqual(enumValues("allergen_severity"));
  });

  it("every code has a label", () => {
    for (const code of ALLERGEN_CODES) {
      expect(ALLERGEN_LABELS[code].trim()).not.toBe("");
    }
  });
});

describe("isAllergenCode / isSeverity", () => {
  it("accepts known values and rejects others", () => {
    expect(isAllergenCode("tree_nuts")).toBe(true);
    expect(isAllergenCode("tree nuts")).toBe(false);
    expect(isAllergenCode("dairy")).toBe(false);
    expect(isSeverity("severe")).toBe(true);
    expect(isSeverity("extreme")).toBe(false);
  });
});

describe("findPredefinedByName", () => {
  it.each([
    ["Milk", "milk"],
    ["  EGGS ", "egg"],
    ["Peanuts", "peanut"],
    ["tree_nuts", "tree_nuts"],
    ["Tree nut", "tree_nuts"],
    ["Wheat / gluten", "wheat_gluten"],
    ["wheat/gluten", "wheat_gluten"],
    ["Gluten", "wheat_gluten"],
    ["Soya", "soy"],
  ])("recognises %j as %s", (name, code) => {
    expect(findPredefinedByName(name)).toBe(code);
  });

  it.each(["", "   ", "dairy", "whey", "nuts", "lupin", "kiwi"])(
    "does not treat %j as a predefined allergen",
    (name) => {
      expect(findPredefinedByName(name)).toBeNull();
    },
  );
});
