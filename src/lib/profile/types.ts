// Row shapes for the Phase 1 tables (see supabase/migrations).

import type { SavedAllergen } from "./allergen-selection";

export type ProfileRow = {
  id: string;
  name: string;
  disclaimer_accepted_at: string | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
};

export type ContactRow = {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  is_primary: boolean;
};

export type MedicationRow = {
  id: string;
  name: string;
  dose: string | null;
  expiry_date: string | null; // YYYY-MM-DD
};

/** Everything the app needs about the signed-in user's profile. */
export type ProfileBundle = {
  profile: ProfileRow;
  allergens: SavedAllergen[];
  primaryContact: ContactRow | null;
  medications: MedicationRow[];
};
