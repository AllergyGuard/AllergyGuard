import { describe, expect, it } from "vitest";
import {
  diffMedications,
  fromMedicationRow,
  toMedicationValues,
  type MedicationDraft,
} from "./medications";
import type { MedicationRow } from "./types";

const epipen: MedicationRow = { id: "m1", name: "EpiPen", dose: "0.3 mg", expiry_date: "2027-01-01" };
const cetirizine: MedicationRow = { id: "m2", name: "Cetirizine", dose: null, expiry_date: null };

describe("toMedicationValues / fromMedicationRow", () => {
  it("trims and turns blanks into null", () => {
    expect(
      toMedicationValues({ key: "k", name: " EpiPen ", dose: "  ", expiryDate: "" }),
    ).toEqual({ name: "EpiPen", dose: null, expiry_date: null });
  });

  it("round-trips a row", () => {
    expect(toMedicationValues(fromMedicationRow(epipen))).toEqual({
      name: "EpiPen",
      dose: "0.3 mg",
      expiry_date: "2027-01-01",
    });
  });
});

describe("diffMedications", () => {
  it("returns nothing to do when unchanged", () => {
    const drafts = [epipen, cetirizine].map(fromMedicationRow);
    expect(diffMedications([epipen, cetirizine], drafts)).toEqual({
      toInsert: [],
      toUpdate: [],
      toDelete: [],
    });
  });

  it("finds inserts, updates and deletes", () => {
    const edited: MedicationDraft[] = [
      { ...fromMedicationRow(epipen), expiryDate: "2027-06-01" },
      { key: "new-1", name: "Salbutamol", dose: "", expiryDate: "" },
    ]; // cetirizine removed
    expect(diffMedications([epipen, cetirizine], edited)).toEqual({
      toInsert: [{ name: "Salbutamol", dose: null, expiry_date: null }],
      toUpdate: [{ id: "m1", name: "EpiPen", dose: "0.3 mg", expiry_date: "2027-06-01" }],
      toDelete: ["m2"],
    });
  });

  it("treats a draft with an unknown id as new", () => {
    const edited: MedicationDraft[] = [
      { key: "x", id: "gone", name: "EpiPen", dose: "", expiryDate: "" },
    ];
    expect(diffMedications([], edited).toInsert).toHaveLength(1);
  });
});
