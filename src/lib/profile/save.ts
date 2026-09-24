// Every profile, allergen, contact and medication write goes through here.
// Runs in the browser (RLS + table constraints protect the data) so that
// Phase 2 can mirror each successful save into Dexie in this one module,
// as CLAUDE.md requires.

import type { SupabaseClient } from "@supabase/supabase-js";
import { diffAllergens, toAllergenRow, type AllergenSelection, type SavedAllergen } from "./allergen-selection";
import { CONTACT_COLUMNS, PROFILE_COLUMNS, loadAllergens, loadMedications } from "./load";
import { diffMedications, type MedicationDraft } from "./medications";
import { FINISHED_STEP, advancedStep } from "./onboarding";
import type { ContactRow, MedicationRow, ProfileRow } from "./types";
import type { ContactDraft } from "./validation";

export type SaveResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const SAVE_ERROR =
  "We couldn't save that. Check your internet connection and try again.";

async function attempt<T>(work: () => Promise<T>): Promise<SaveResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    console.error("Profile save failed", error);
    return { ok: false, error: SAVE_ERROR };
  }
}

/** Throws on a Supabase error (for writes that return no rows). */
function ensureOk(result: { error: unknown }): void {
  if (result.error) throw result.error;
}

/** Throws on a Supabase error or a missing row; returns the row. */
function rowOf<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  if (result.data === null) throw new Error("Expected a row but got none");
  return result.data;
}

/** Moves onboarding forward to `completed` (never backwards). No-op after onboarding. */
async function markStep(supabase: SupabaseClient, profile: ProfileRow, completed: number) {
  if (profile.onboarding_completed_at !== null) return profile;
  const step = advancedStep(profile.onboarding_step, completed);
  if (step === profile.onboarding_step) return profile;
  return rowOf(
    await supabase
      .from("profiles")
      .update({ onboarding_step: step })
      .eq("id", profile.id)
      .select(PROFILE_COLUMNS)
      .single<ProfileRow>(),
  );
}

/**
 * Onboarding step 2. Creates the profile, recording when the step 1 disclaimer
 * was accepted, or renames an existing one.
 */
export function saveProfileName(
  supabase: SupabaseClient,
  existing: ProfileRow | null,
  name: string,
): Promise<SaveResult<ProfileRow>> {
  return attempt(async () => {
    if (!existing) {
      return rowOf(
        await supabase
          .from("profiles")
          .insert({
            name: name.trim(),
            disclaimer_accepted_at: new Date().toISOString(),
            onboarding_step: 2,
          })
          .select(PROFILE_COLUMNS)
          .single<ProfileRow>(),
      );
    }
    const updated = rowOf(
      await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          ...(existing.disclaimer_accepted_at === null && {
            disclaimer_accepted_at: new Date().toISOString(),
          }),
        })
        .eq("id", existing.id)
        .select(PROFILE_COLUMNS)
        .single<ProfileRow>(),
    );
    return markStep(supabase, updated, 2);
  });
}

/** Applies the minimum inserts/updates/deletes and returns the saved list. */
export function saveAllergens(
  supabase: SupabaseClient,
  profile: ProfileRow,
  saved: readonly SavedAllergen[],
  edited: readonly AllergenSelection[],
): Promise<SaveResult<{ profile: ProfileRow; allergens: SavedAllergen[] }>> {
  return attempt(async () => {
    const diff = diffAllergens(saved, edited);
    if (diff.toDelete.length > 0) {
      ensureOk(await supabase.from("profile_allergens").delete().in("id", diff.toDelete));
    }
    for (const { id, severity } of diff.toUpdate) {
      ensureOk(await supabase.from("profile_allergens").update({ severity }).eq("id", id));
    }
    if (diff.toInsert.length > 0) {
      ensureOk(
        await supabase
          .from("profile_allergens")
          .insert(diff.toInsert.map((s) => toAllergenRow(profile.id, s))),
      );
    }
    const allergens = await loadAllergens(supabase, profile.id);
    return { profile: await markStep(supabase, profile, 3), allergens };
  });
}

function contactValues(draft: ContactDraft) {
  return {
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    relationship: draft.relationship.trim() || null,
  };
}

async function insertContact(
  supabase: SupabaseClient,
  profileId: string,
  draft: ContactDraft,
  isPrimary: boolean,
): Promise<ContactRow> {
  return rowOf(
    await supabase
      .from("emergency_contacts")
      .insert({ ...contactValues(draft), profile_id: profileId, is_primary: isPrimary })
      .select(CONTACT_COLUMNS)
      .single<ContactRow>(),
  );
}

async function updateContactRow(
  supabase: SupabaseClient,
  contactId: string,
  draft: ContactDraft,
): Promise<ContactRow> {
  return rowOf(
    await supabase
      .from("emergency_contacts")
      .update(contactValues(draft))
      .eq("id", contactId)
      .select(CONTACT_COLUMNS)
      .single<ContactRow>(),
  );
}

/** Onboarding step 4: adds the primary emergency contact, or updates it if one exists. */
export function savePrimaryContact(
  supabase: SupabaseClient,
  profile: ProfileRow,
  existing: ContactRow | null,
  draft: ContactDraft,
): Promise<SaveResult<{ profile: ProfileRow; contact: ContactRow }>> {
  return attempt(async () => {
    const contact = existing
      ? await updateContactRow(supabase, existing.id, draft)
      : await insertContact(supabase, profile.id, draft, true);
    return { profile: await markStep(supabase, profile, 4), contact };
  });
}

/** Adds a contact. The first contact on a profile becomes the primary. */
export function addContact(
  supabase: SupabaseClient,
  profileId: string,
  draft: ContactDraft,
  isFirst: boolean,
): Promise<SaveResult<ContactRow>> {
  return attempt(() => insertContact(supabase, profileId, draft, isFirst));
}

export function updateContact(
  supabase: SupabaseClient,
  contactId: string,
  draft: ContactDraft,
): Promise<SaveResult<ContactRow>> {
  return attempt(() => updateContactRow(supabase, contactId, draft));
}

/** Makes this contact the primary, clearing the old one in the same transaction. */
export function setPrimaryContact(
  supabase: SupabaseClient,
  contactId: string,
): Promise<SaveResult<null>> {
  return attempt(async () => {
    ensureOk(await supabase.rpc("set_primary_contact", { contact_id: contactId }));
    return null;
  });
}

/**
 * Deletes a contact in one transaction. If it was the primary and others
 * remain, the database promotes the oldest; its id is returned (else null).
 */
export function deleteContact(
  supabase: SupabaseClient,
  contactId: string,
): Promise<SaveResult<{ promotedId: string | null }>> {
  return attempt(async () => {
    const result = await supabase.rpc("delete_contact", { contact_id: contactId });
    ensureOk(result);
    return { promotedId: (result.data as string | null) ?? null };
  });
}

/** Onboarding step 4 "Add later". */
export function skipContact(
  supabase: SupabaseClient,
  profile: ProfileRow,
): Promise<SaveResult<ProfileRow>> {
  return attempt(() => markStep(supabase, profile, 4));
}

export function saveMedications(
  supabase: SupabaseClient,
  profile: ProfileRow,
  saved: readonly MedicationRow[],
  edited: readonly MedicationDraft[],
): Promise<SaveResult<MedicationRow[]>> {
  return attempt(async () => {
    const diff = diffMedications(saved, edited);
    if (diff.toDelete.length > 0) {
      ensureOk(await supabase.from("medications").delete().in("id", diff.toDelete));
    }
    for (const { id, ...values } of diff.toUpdate) {
      ensureOk(await supabase.from("medications").update(values).eq("id", id));
    }
    if (diff.toInsert.length > 0) {
      ensureOk(
        await supabase
          .from("medications")
          .insert(diff.toInsert.map((values) => ({ ...values, profile_id: profile.id }))),
      );
    }
    return loadMedications(supabase, profile.id);
  });
}

/** Onboarding step 5 done: marks the wizard finished. */
export function finishOnboarding(
  supabase: SupabaseClient,
  profile: ProfileRow,
): Promise<SaveResult<ProfileRow>> {
  return attempt(async () =>
    rowOf(
      await supabase
        .from("profiles")
        .update({
          onboarding_step: FINISHED_STEP,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select(PROFILE_COLUMNS)
        .single<ProfileRow>(),
    ),
  );
}
