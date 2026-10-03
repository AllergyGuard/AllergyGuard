import { describe, expect, it } from "vitest";
import type { SavedAllergen } from "@/lib/profile/allergen-selection";
import { formatSyncedAt, sortAllergensForCard, telHref } from "./card-format";

describe("telHref", () => {
  it.each([
    ["+91 98765 43210", "tel:+919876543210"],
    ["+44 (20) 7946-0958", "tel:+442079460958"],
    ["  +1.415.555.0100 ", "tel:+14155550100"],
    ["09876 543210", "tel:09876543210"], // no country code: kept as local
    ["(020) 7946 0958", "tel:02079460958"],
  ])("%s → %s", (phone, href) => {
    expect(telHref(phone)).toBe(href);
  });
});

describe("sortAllergensForCard", () => {
  const a = (id: string, severity: SavedAllergen["severity"]): SavedAllergen => ({
    id,
    kind: "custom",
    name: id,
    severity,
  });

  it("lists severe first, then moderate, mild, and not set, keeping added order within each", () => {
    const sorted = sortAllergensForCard([
      a("mild1", "mild"),
      a("none1", null),
      a("severe1", "severe"),
      a("moderate1", "moderate"),
      a("severe2", "severe"),
    ]);
    expect(sorted.map((x) => x.id)).toEqual(["severe1", "severe2", "moderate1", "mild1", "none1"]);
  });

  it("does not mutate its input", () => {
    const input = [a("x", "mild"), a("y", "severe")];
    sortAllergensForCard(input);
    expect(input.map((x) => x.id)).toEqual(["x", "y"]);
  });
});

describe("formatSyncedAt", () => {
  it("formats the sync time for the given locale and zone", () => {
    expect(formatSyncedAt("2026-10-03T09:30:00.000Z", "en-GB", "Europe/London")).toBe(
      "3 Oct 2026, 10:30",
    );
  });
});
