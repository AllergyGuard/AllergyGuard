import { describe, expect, it } from "vitest";
import {
  hasErrors,
  isExpired,
  todayIso,
  validateAllergenList,
  validateContact,
  validateMedication,
  validatePhone,
  PHONE_FORMAT_ERROR,
  emptyContactDraft,
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
  it.each(["+91 98765 43210", "+919876543210", "+44 20-7946-0958", "+1.555.123.4567", "+683 4002"])(
    "accepts %s",
    (phone) => {
      expect(validatePhone(phone)).toBeNull();
    },
  );

  it.each([
    "9876543210", // no country code
    "098765 43210",
    "+0 98765 43210", // country codes never start with 0
    "+44 (0)20 7946 0958", // brackets: would dial +44020...
    "(044) 2345 6789",
    "+91 98765 43210 ext 5",
    "+1234567890123456", // 16 digits
    "+12345",
    "abc1234567",
  ])("rejects %j", (phone) => {
    expect(validatePhone(phone)).toEqual(expect.any(String));
  });

  it.each(["", "  ", "+", "+91", "+91 "])("asks for a number when %j is all that's entered", (phone) => {
    expect(validatePhone(phone)).toBe("Enter a phone number.");
  });

  it("explains the country code when it is missing", () => {
    expect(validatePhone("98765 43210")).toBe(PHONE_FORMAT_ERROR);
  });
});

describe("emptyContactDraft", () => {
  it("prefills the phone with +91 and a space", () => {
    expect(emptyContactDraft()).toEqual({ name: "", phone: "+91 ", relationship: "" });
  });
});

describe("validateContact", () => {
  it("accepts a name and phone with no relationship", () => {
    expect(validateContact({ name: "Asha", phone: "+91 98765 43210", relationship: "" })).toEqual({});
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
