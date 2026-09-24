import { describe, expect, it } from "vitest";
import {
  hasErrors,
  isExpired,
  todayIso,
  validateAllergenList,
  validateContact,
  validateMedication,
  validatePhone,
  validateProfileName,
} from "./validation";

describe("validateProfileName", () => {
  it("requires a name", () => {
    expect(validateProfileName("   ")).toEqual(expect.any(String));
  });
  it("accepts up to 100 characters", () => {
    expect(validateProfileName("a".repeat(100))).toBeNull();
    expect(validateProfileName("a".repeat(101))).toMatch("100");
  });
});

describe("validateAllergenList", () => {
  it("requires at least one allergen", () => {
    expect(validateAllergenList([])).toEqual(expect.any(String));
  });
  it("counts a custom allergen", () => {
    expect(validateAllergenList([{ kind: "custom", name: "Lupin", severity: null }])).toBeNull();
  });
});

describe("validatePhone (mirrors the database check)", () => {
  it.each(["+91 98765 43210", "9876543210", "044-2345-6789", "(044) 2345 6789", "+1.555.123.4567"])(
    "accepts %s",
    (phone) => {
      expect(validatePhone(phone)).toBeNull();
    },
  );

  it.each(["", "---", "12345", "abc1234567", "+91 98765 43210 ext 5", "1234567890123456", "+"])(
    "rejects %j",
    (phone) => {
      expect(validatePhone(phone)).toEqual(expect.any(String));
    },
  );
});

describe("validateContact", () => {
  it("accepts a name and phone with no relationship", () => {
    expect(validateContact({ name: "Asha", phone: "9876543210", relationship: "" })).toEqual({});
  });

  it("reports each invalid field", () => {
    const errors = validateContact({ name: " ", phone: "12", relationship: "x".repeat(51) });
    expect(Object.keys(errors).sort()).toEqual(["name", "phone", "relationship"]);
    expect(hasErrors(errors)).toBe(true);
  });
});

describe("validateMedication", () => {
  it("only requires a name", () => {
    expect(validateMedication({ name: "EpiPen", dose: "", expiryDate: "" })).toEqual({});
  });

  it("rejects a missing name, long dose and impossible date", () => {
    const errors = validateMedication({ name: "", dose: "x".repeat(101), expiryDate: "2026-02-30" });
    expect(Object.keys(errors).sort()).toEqual(["dose", "expiryDate", "name"]);
  });

  it("accepts a real date", () => {
    expect(validateMedication({ name: "EpiPen", dose: "0.3 mg", expiryDate: "2028-02-29" })).toEqual({});
  });
});

describe("todayIso / isExpired", () => {
  it("formats the local date", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });

  it("is expired only strictly before today", () => {
    expect(isExpired("2026-09-24", "2026-09-25")).toBe(true);
    expect(isExpired("2026-09-25", "2026-09-25")).toBe(false);
    expect(isExpired(null, "2026-09-25")).toBe(false);
    expect(isExpired("", "2026-09-25")).toBe(false);
  });
});
