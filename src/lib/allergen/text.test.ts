import { describe, expect, it } from "vitest";
import { hasReadableText, normalizeIngredientText, originalSlice } from "./text";

describe("normalizeIngredientText", () => {
  it("lowercases and strips accents", () => {
    expect(normalizeIngredientText("Crème FRAÎCHE").text).toBe("creme fraiche");
  });

  it("turns Open Food Facts _emphasis_ underscores into spaces", () => {
    expect(normalizeIngredientText("sugar, _whey_ powder").text).toBe("sugar,  whey  powder");
  });

  it("rejoins words that OCR split across lines with a hyphen", () => {
    expect(normalizeIngredientText("sodium cas-\nein, salt").text).toBe("sodium casein, salt");
    expect(normalizeIngredientText("cas- \r\n  einate").text).toBe("caseinate");
  });

  it("keeps a hyphen that is not at a line break", () => {
    expect(normalizeIngredientText("milk-free").text).toBe("milk-free");
  });

  it("expands ligatures from OCR", () => {
    expect(normalizeIngredientText("ﬂour").text).toBe("flour");
  });

  it("maps every normalized range back to the original text", () => {
    const raw = "Sugar, _Crème_ fraîche, cas-\nein";
    const n = normalizeIngredientText(raw);
    const creme = n.text.indexOf("creme");
    expect(originalSlice(raw, n, creme, creme + 5)).toBe("Crème");
    const casein = n.text.indexOf("casein");
    expect(originalSlice(raw, n, casein, casein + 6)).toBe("cas-\nein");
  });
});

describe("hasReadableText", () => {
  it.each([null, undefined, "", "   ", "\n\t", "..., ;", "-- 123 --"])(
    "is false for %j",
    (value) => {
      expect(hasReadableText(value)).toBe(false);
    },
  );

  it.each(["milk", "E322", " sugar. "])("is true for %j", (value) => {
    expect(hasReadableText(value)).toBe(true);
  });
});
