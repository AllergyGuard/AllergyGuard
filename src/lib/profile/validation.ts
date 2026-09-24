// Pure validation for profile, emergency contact and medication forms.
// Rules mirror the database check constraints so a form that passes here
// won't be rejected by Postgres.

import type { AllergenSelection } from "./allergen-selection";

export const NAME_MAX_LENGTH = 100;
export const RELATIONSHIP_MAX_LENGTH = 50;
export const DOSE_MAX_LENGTH = 100;

/** Field name → message. An empty object means the input is valid. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}

export function validateProfileName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === "") return "Enter a name for this profile.";
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Keep the name under ${NAME_MAX_LENGTH} characters.`;
  }
  return null;
}

export function validateAllergenList(selections: readonly AllergenSelection[]): string | null {
  return selections.length === 0
    ? "Choose at least one allergen, or add your own under \"Something else?\"."
    : null;
}

// Same rule as emergency_contacts_phone_format in the Phase 1 migration.
const PHONE_SHAPE = /^\+?[0-9(][0-9 ().-]*[0-9]$/;

export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (trimmed === "") return "Enter a phone number.";
  const digits = trimmed.replace(/[^0-9]/g, "").length;
  if (!PHONE_SHAPE.test(trimmed) || digits < 7 || digits > 15) {
    return "Enter a phone number with 7 to 15 digits, e.g. +91 98765 43210.";
  }
  return null;
}

export type ContactDraft = { name: string; phone: string; relationship: string };

export function validateContact(draft: ContactDraft): FieldErrors<ContactDraft> {
  const errors: FieldErrors<ContactDraft> = {};
  const name = draft.name.trim();
  if (name === "") errors.name = "Enter your contact's name.";
  else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Keep the name under ${NAME_MAX_LENGTH} characters.`;
  }
  const phoneError = validatePhone(draft.phone);
  if (phoneError) errors.phone = phoneError;
  if (draft.relationship.trim().length > RELATIONSHIP_MAX_LENGTH) {
    errors.relationship = `Keep this under ${RELATIONSHIP_MAX_LENGTH} characters.`;
  }
  return errors;
}

export type MedicationFields = { name: string; dose: string; expiryDate: string };

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

export function validateMedication(draft: MedicationFields): FieldErrors<MedicationFields> {
  const errors: FieldErrors<MedicationFields> = {};
  const name = draft.name.trim();
  if (name === "") errors.name = "Enter the medication's name.";
  else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Keep the name under ${NAME_MAX_LENGTH} characters.`;
  }
  if (draft.dose.trim().length > DOSE_MAX_LENGTH) {
    errors.dose = `Keep the dose under ${DOSE_MAX_LENGTH} characters.`;
  }
  if (draft.expiryDate !== "" && !isRealDate(draft.expiryDate)) {
    errors.expiryDate = "Enter a real date, or leave it blank.";
  }
  return errors;
}

/** Today's date in the user's local time zone, as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** True when a YYYY-MM-DD expiry date is before `today` (also YYYY-MM-DD). */
export function isExpired(expiryDate: string | null, today: string): boolean {
  return expiryDate !== null && expiryDate !== "" && expiryDate < today;
}
