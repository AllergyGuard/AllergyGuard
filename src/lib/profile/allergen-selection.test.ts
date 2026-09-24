import { describe, expect, it } from "vitest";
import {
  addCustom,
  diffAllergens,
  fromAllergenRow,
  isSelected,
  normalizeCustomName,
  removeSelection,
  selectionKey,
  selectionLabel,
  setSeverity,
  toAllergenRow,
  toggleAllergen,
  validateCustomAllergen,
  type AllergenSelection,
  type SavedAllergen,
} from "./allergen-selection";

const milk: AllergenSelection = { kind: "predefined", code: "milk", severity: null };
const lupin: AllergenSelection = { kind: "custom", name: "Lupin", severity: "mild" };

describe("normalizeCustomName / selectionKey / selectionLabel", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeCustomName("  green   kiwi \n")).toBe("green kiwi");
  });

  it("keys custom names case-insensitively", () => {
    expect(selectionKey({ kind: "custom", name: " LUPIN ", severity: null })).toBe(
      selectionKey(lupin),
    );
  });

  it("keeps predefined and custom keys distinct", () => {
    expect(selectionKey(milk)).not.toBe(
      selectionKey({ kind: "custom", name: "milk", severity: null }),
    );
  });

  it("labels predefined allergens with their display label", () => {
    expect(selectionLabel({ kind: "predefined", code: "tree_nuts", severity: null })).toBe(
      "Tree nuts",
    );
    expect(selectionLabel(lupin)).toBe("Lupin");
  });
});

describe("validateCustomAllergen", () => {
  it("rejects empty and whitespace-only names", () => {
    expect(validateCustomAllergen("   ", [])).toEqual(expect.any(String));
  });

  it("rejects names over 100 characters", () => {
    expect(validateCustomAllergen("a".repeat(101), [])).toMatch("100");
    expect(validateCustomAllergen("a".repeat(100), [])).toBeNull();
  });

  it("points predefined names back to the list", () => {
    expect(validateCustomAllergen("peanuts", [])).toMatch(/Peanut.*list/);
  });

  it("rejects a duplicate custom name, ignoring case and spacing", () => {
    // Names the entry already in the list, not what was just typed.
    expect(validateCustomAllergen("  LUPIN ", [lupin])).toBe("You've already added Lupin.");
  });

  it("accepts synonyms as custom text (synonym matching is Phase 3's job)", () => {
    expect(validateCustomAllergen("dairy", [])).toBeNull();
    expect(validateCustomAllergen("whey", [])).toBeNull();
  });
});

describe("toggleAllergen / isSelected", () => {
  it("adds an unticked allergen with no severity", () => {
    const next = toggleAllergen([], "milk");
    expect(next).toEqual([milk]);
    expect(isSelected(next, "milk")).toBe(true);
  });

  it("removes a ticked allergen", () => {
    expect(toggleAllergen([milk, lupin], "milk")).toEqual([lupin]);
  });

  it("does not mutate the input", () => {
    const current = [milk];
    toggleAllergen(current, "egg");
    expect(current).toEqual([milk]);
  });
});

describe("addCustom / removeSelection / setSeverity", () => {
  it("adds a normalized custom allergen", () => {
    expect(addCustom([], "  green  kiwi ")).toEqual([
      { kind: "custom", name: "green kiwi", severity: null },
    ]);
  });

  it("ignores invalid names", () => {
    expect(addCustom([lupin], "LUPIN")).toEqual([lupin]);
    expect(addCustom([], "Milk")).toEqual([]);
  });

  it("removes by key", () => {
    expect(removeSelection([milk, lupin], selectionKey(lupin))).toEqual([milk]);
  });

  it("sets and clears severity for one entry only", () => {
    const withSevere = setSeverity([milk, lupin], selectionKey(milk), "severe");
    expect(withSevere).toEqual([{ ...milk, severity: "severe" }, lupin]);
    expect(setSeverity(withSevere, selectionKey(milk), null)[0].severity).toBeNull();
  });
});

describe("toAllergenRow / fromAllergenRow", () => {
  it("maps a predefined selection to a row", () => {
    expect(toAllergenRow("p1", { ...milk, severity: "severe" })).toEqual({
      profile_id: "p1",
      allergen: "milk",
      custom_name: null,
      severity: "severe",
    });
  });

  it("maps a custom selection to a row with the normalized name", () => {
    expect(toAllergenRow("p1", { kind: "custom", name: " Lupin ", severity: null })).toEqual({
      profile_id: "p1",
      allergen: null,
      custom_name: "Lupin",
      severity: null,
    });
  });

  it("round-trips rows", () => {
    expect(
      fromAllergenRow({ id: "r1", allergen: "egg", custom_name: null, severity: "mild" }),
    ).toEqual({ kind: "predefined", code: "egg", severity: "mild", id: "r1" });
    expect(
      fromAllergenRow({ id: "r2", allergen: null, custom_name: "Lupin", severity: null }),
    ).toEqual({ kind: "custom", name: "Lupin", severity: null, id: "r2" });
  });

  it("returns null for rows it can't interpret", () => {
    expect(
      fromAllergenRow({ id: "r3", allergen: "kiwi", custom_name: null, severity: null }),
    ).toBeNull();
    expect(
      fromAllergenRow({ id: "r4", allergen: null, custom_name: null, severity: null }),
    ).toBeNull();
  });

  it("drops an unknown severity rather than failing", () => {
    expect(
      fromAllergenRow({ id: "r5", allergen: "egg", custom_name: null, severity: "extreme" })
        ?.severity,
    ).toBeNull();
  });
});

describe("diffAllergens", () => {
  const saved: SavedAllergen[] = [
    { kind: "predefined", code: "milk", severity: null, id: "m" },
    { kind: "custom", name: "Lupin", severity: "mild", id: "l" },
    { kind: "predefined", code: "egg", severity: "severe", id: "e" },
  ];

  it("returns nothing to do when unchanged", () => {
    expect(diffAllergens(saved, saved)).toEqual({ toInsert: [], toUpdate: [], toDelete: [] });
  });

  it("finds inserts, severity updates and deletes", () => {
    const edited: AllergenSelection[] = [
      { kind: "predefined", code: "milk", severity: "moderate" }, // severity changed
      { kind: "custom", name: "lupin", severity: "mild" }, // same entry, different case
      { kind: "predefined", code: "sesame", severity: null }, // new
    ]; // egg removed
    expect(diffAllergens(saved, edited)).toEqual({
      toInsert: [{ kind: "predefined", code: "sesame", severity: null }],
      toUpdate: [{ id: "m", severity: "moderate" }],
      toDelete: ["e"],
    });
  });
});
