// Pure helpers for editing a profile's medication list.

import type { MedicationRow } from "./types";

/** A medication being edited. `key` is a stable client-side id; `id` is the row id once saved. */
export type MedicationDraft = {
  key: string;
  id?: string;
  name: string;
  dose: string;
  expiryDate: string; // YYYY-MM-DD or ""
};

export type MedicationValues = {
  name: string;
  dose: string | null;
  expiry_date: string | null;
};

export function toMedicationValues(draft: MedicationDraft): MedicationValues {
  const dose = draft.dose.trim();
  return {
    name: draft.name.trim(),
    dose: dose === "" ? null : dose,
    expiry_date: draft.expiryDate === "" ? null : draft.expiryDate,
  };
}

export function fromMedicationRow(row: MedicationRow): MedicationDraft {
  return {
    key: row.id,
    id: row.id,
    name: row.name,
    dose: row.dose ?? "",
    expiryDate: row.expiry_date ?? "",
  };
}

export type MedicationDiff = {
  toInsert: MedicationValues[];
  toUpdate: ({ id: string } & MedicationValues)[];
  toDelete: string[];
};

/** Minimum inserts, updates and deletes to go from saved rows to the edited list. */
export function diffMedications(
  saved: readonly MedicationRow[],
  edited: readonly MedicationDraft[],
): MedicationDiff {
  const savedById = new Map(saved.map((row) => [row.id, row]));
  const keptIds = new Set<string>();
  const diff: MedicationDiff = { toInsert: [], toUpdate: [], toDelete: [] };

  for (const draft of edited) {
    const values = toMedicationValues(draft);
    const existing = draft.id ? savedById.get(draft.id) : undefined;
    if (!existing) {
      diff.toInsert.push(values);
      continue;
    }
    keptIds.add(existing.id);
    if (
      existing.name !== values.name ||
      existing.dose !== values.dose ||
      existing.expiry_date !== values.expiry_date
    ) {
      diff.toUpdate.push({ id: existing.id, ...values });
    }
  }
  diff.toDelete = saved.filter((row) => !keptIds.has(row.id)).map((row) => row.id);
  return diff;
}
