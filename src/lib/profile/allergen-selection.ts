// Pure helpers for editing a profile's allergen list. Shared by the
// AllergenPicker, the onboarding wizard (US-03) and edit profile (US-09).

import {
  ALLERGEN_LABELS,
  findPredefinedByName,
  isAllergenCode,
  isSeverity,
  type AllergenCode,
  type Severity,
} from "@/lib/allergen/codes";

export const CUSTOM_NAME_MAX_LENGTH = 100;

export type AllergenSelection =
  | { kind: "predefined"; code: AllergenCode; severity: Severity | null; id?: string }
  | { kind: "custom"; name: string; severity: Severity | null; id?: string };

/** A selection loaded from the database, so it has a row id. */
export type SavedAllergen = AllergenSelection & { id: string };

/** Row shape of public.profile_allergens used for reads and inserts. */
export type AllergenRow = {
  id?: string;
  profile_id?: string;
  allergen: string | null;
  custom_name: string | null;
  severity: string | null;
};

export function normalizeCustomName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

/** Stable identity: one entry per predefined code or per custom name (case-insensitive). */
export function selectionKey(selection: AllergenSelection): string {
  return selection.kind === "predefined"
    ? `predefined:${selection.code}`
    : `custom:${normalizeCustomName(selection.name).toLowerCase()}`;
}

export function selectionLabel(selection: AllergenSelection): string {
  return selection.kind === "predefined"
    ? ALLERGEN_LABELS[selection.code]
    : normalizeCustomName(selection.name);
}

export function isSelected(current: readonly AllergenSelection[], code: AllergenCode): boolean {
  return current.some((s) => s.kind === "predefined" && s.code === code);
}

/** Returns an error message for a proposed custom allergen, or null if it can be added. */
export function validateCustomAllergen(
  name: string,
  current: readonly AllergenSelection[],
): string | null {
  const normalized = normalizeCustomName(name);
  if (normalized === "") return "Type the name of the allergen.";
  if (normalized.length > CUSTOM_NAME_MAX_LENGTH) {
    return `Keep it under ${CUSTOM_NAME_MAX_LENGTH} characters.`;
  }
  const predefined = findPredefinedByName(normalized);
  if (predefined) {
    return `${ALLERGEN_LABELS[predefined]} is already in the list above. Tick it there instead.`;
  }
  const key = selectionKey({ kind: "custom", name: normalized, severity: null });
  const existing = current.find((s) => selectionKey(s) === key);
  if (existing) {
    return `You've already added ${selectionLabel(existing)}.`;
  }
  return null;
}

/** Tick or untick a predefined allergen. New ticks start with no severity ("Not sure"). */
export function toggleAllergen(
  current: readonly AllergenSelection[],
  code: AllergenCode,
): AllergenSelection[] {
  if (isSelected(current, code)) {
    return current.filter((s) => !(s.kind === "predefined" && s.code === code));
  }
  return [...current, { kind: "predefined", code, severity: null }];
}

/** Add a custom allergen. Returns `current` unchanged if the name is invalid. */
export function addCustom(
  current: readonly AllergenSelection[],
  name: string,
): AllergenSelection[] {
  if (validateCustomAllergen(name, current) !== null) return [...current];
  return [...current, { kind: "custom", name: normalizeCustomName(name), severity: null }];
}

export function removeSelection(
  current: readonly AllergenSelection[],
  key: string,
): AllergenSelection[] {
  return current.filter((s) => selectionKey(s) !== key);
}

export function setSeverity(
  current: readonly AllergenSelection[],
  key: string,
  severity: Severity | null,
): AllergenSelection[] {
  return current.map((s) => (selectionKey(s) === key ? { ...s, severity } : s));
}

// ---------------------------------------------------------------------------
// Database mapping
// ---------------------------------------------------------------------------

export function toAllergenRow(profileId: string, selection: AllergenSelection): AllergenRow {
  return {
    profile_id: profileId,
    allergen: selection.kind === "predefined" ? selection.code : null,
    custom_name: selection.kind === "custom" ? normalizeCustomName(selection.name) : null,
    severity: selection.severity,
  };
}

/** Returns null for a row that doesn't fit the expected shape (e.g. unknown enum value). */
export function fromAllergenRow(row: AllergenRow & { id: string }): SavedAllergen | null {
  const severity = row.severity !== null && isSeverity(row.severity) ? row.severity : null;
  if (row.allergen !== null && isAllergenCode(row.allergen)) {
    return { kind: "predefined", code: row.allergen, severity, id: row.id };
  }
  if (row.allergen === null && row.custom_name) {
    return { kind: "custom", name: row.custom_name, severity, id: row.id };
  }
  return null;
}

export type AllergenDiff = {
  toInsert: AllergenSelection[];
  toUpdate: { id: string; severity: Severity | null }[];
  toDelete: string[];
};

/** Work out the minimum inserts, severity updates and deletes to go from saved to edited. */
export function diffAllergens(
  saved: readonly SavedAllergen[],
  edited: readonly AllergenSelection[],
): AllergenDiff {
  const savedByKey = new Map(saved.map((s) => [selectionKey(s), s]));
  const editedKeys = new Set(edited.map(selectionKey));

  const toInsert: AllergenSelection[] = [];
  const toUpdate: AllergenDiff["toUpdate"] = [];
  for (const item of edited) {
    const existing = savedByKey.get(selectionKey(item));
    if (!existing) toInsert.push(item);
    else if (existing.severity !== item.severity) {
      toUpdate.push({ id: existing.id, severity: item.severity });
    }
  }
  const toDelete = saved.filter((s) => !editedKeys.has(selectionKey(s))).map((s) => s.id);

  return { toInsert, toUpdate, toDelete };
}
