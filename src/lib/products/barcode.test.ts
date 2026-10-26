import { describe, expect, it } from "vitest";
import { normalizeBarcode, validateBarcode } from "./barcode";

describe("normalizeBarcode", () => {
  it("removes spaces and hyphens people type or paste", () => {
    expect(normalizeBarcode(" 3017 6204-22003 ")).toBe("3017620422003");
  });
});

describe("validateBarcode", () => {
  it.each([
    ["3017620422003", "EAN-13 (Nutella)"],
    ["8901063010376", "EAN-13 (India, 890 prefix)"],
    ["96385074", "EAN-8"],
    ["036000291452", "UPC-A"],
    ["10036000291459", "GTIN-14"],
  ])("accepts %s, a valid %s", (code) => {
    expect(validateBarcode(code)).toBeNull();
  });

  it("accepts a valid code with spaces", () => {
    expect(validateBarcode("3017 6204 22003")).toBeNull();
  });

  it.each([
    ["", "Enter the barcode number."],
    ["   ", "Enter the barcode number."],
    ["30176204220", "A barcode has 8, 12, 13 or 14 digits."],
    ["301762042200345", "A barcode has 8, 12, 13 or 14 digits."],
    ["30176A0422003", "A barcode has only digits."],
    ["3017620422004", "That barcode doesn't add up. Check the digits and try again."],
    ["0000000000000", "That barcode doesn't add up. Check the digits and try again."],
  ])("rejects %j", (code, message) => {
    expect(validateBarcode(code)).toBe(message);
  });
});
