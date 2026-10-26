import { describe, expect, it } from "vitest";
import { checkAllergens } from "@/lib/allergen/check";
import { highlightSegments } from "./highlight";

const MILK = [{ kind: "predefined" as const, code: "milk" as const }];

describe("highlightSegments", () => {
  it("marks each match and keeps every character of the raw text", () => {
    const raw = "Sugar, _whey_ powder. May contain milk.";
    const segments = highlightSegments(raw, checkAllergens(raw, MILK).matches);
    expect(segments.map((s) => s.text).join("")).toBe(raw);
    expect(segments.filter((s) => s.kind)).toEqual([
      { text: "whey", kind: "contains" },
      { text: "milk", kind: "may_contain" },
    ]);
  });

  it("ignores declared matches, which have no position", () => {
    const raw = "sugar, palm oil";
    const r = checkAllergens(raw, MILK, { declared: { contains: ["milk"], mayContain: [] } });
    expect(highlightSegments(raw, r.matches)).toEqual([{ text: raw, kind: null }]);
  });

  it("returns nothing for empty text", () => {
    expect(highlightSegments("", [])).toEqual([]);
  });

  it("lets 'contains' win where matches overlap", () => {
    const segments = highlightSegments("abcdef", [
      { allergen: "A", term: "bcd", text: "bcd", kind: "may_contain", source: "ingredients", start: 1, end: 4 },
      { allergen: "B", term: "cde", text: "cde", kind: "contains", source: "ingredients", start: 2, end: 5 },
    ]);
    expect(segments).toEqual([
      { text: "a", kind: null },
      { text: "b", kind: "may_contain" },
      { text: "cde", kind: "contains" },
      { text: "f", kind: null },
    ]);
  });
});
