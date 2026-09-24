import type { SupabaseClient } from "@supabase/supabase-js";
import { fromAllergenRow, type SavedAllergen } from "./allergen-selection";
import type { ContactRow, MedicationRow, ProfileBundle, ProfileRow } from "./types";

export const PROFILE_COLUMNS =
  "id, name, disclaimer_accepted_at, onboarding_step, onboarding_completed_at";
export const CONTACT_COLUMNS = "id, name, phone, relationship, is_primary";
export const MEDICATION_COLUMNS = "id, name, dose, expiry_date";

/**
 * Loads the signed-in user's profile and its child rows. Works with the
 * server or browser client; RLS limits results to profiles the user owns.
 * Until family profiles (Phase 10) the user's first profile is "their" profile.
 */
export async function loadOwnProfile(supabase: SupabaseClient): Promise<ProfileBundle | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ProfileRow>();
  if (error) throw error;
  if (!profile) return null;

  const [allergens, contact, medications] = await Promise.all([
    loadAllergens(supabase, profile.id),
    supabase
      .from("emergency_contacts")
      .select(CONTACT_COLUMNS)
      .eq("profile_id", profile.id)
      .eq("is_primary", true)
      .maybeSingle<ContactRow>(),
    supabase
      .from("medications")
      .select(MEDICATION_COLUMNS)
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: true })
      .returns<MedicationRow[]>(),
  ]);
  if (contact.error) throw contact.error;
  if (medications.error) throw medications.error;

  return {
    profile,
    allergens,
    primaryContact: contact.data,
    medications: medications.data ?? [],
  };
}

export async function loadAllergens(
  supabase: SupabaseClient,
  profileId: string,
): Promise<SavedAllergen[]> {
  const { data, error } = await supabase
    .from("profile_allergens")
    .select("id, allergen, custom_name, severity")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).flatMap((row) => fromAllergenRow(row) ?? []);
}

export async function loadMedications(
  supabase: SupabaseClient,
  profileId: string,
): Promise<MedicationRow[]> {
  const { data, error } = await supabase
    .from("medications")
    .select(MEDICATION_COLUMNS)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true })
    .returns<MedicationRow[]>();
  if (error) throw error;
  return data ?? [];
}

/** All emergency contacts for a profile, primary first, then oldest first. */
export async function loadContacts(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ContactRow[]> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .select(CONTACT_COLUMNS)
    .eq("profile_id", profileId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })
    .returns<ContactRow[]>();
  if (error) throw error;
  return data ?? [];
}
