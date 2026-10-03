// The on-device copy of the emergency card. /emergency reads ONLY from here,
// never from the network (CLAUDE.md), so it works offline.

import Dexie, { type EntityTable } from "dexie";
import type { SavedAllergen } from "@/lib/profile/allergen-selection";
import type { ContactRow, MedicationRow } from "@/lib/profile/types";

/**
 * One snapshot per profile, rewritten whole after every save, so it can never
 * be half-updated. Keyed by profile (not user) so Phase 10 family profiles
 * each get their own card.
 */
export type EmergencyCard = {
  profileId: string;
  /** auth user id; cards of any other user are dropped on the next sync. */
  ownerId: string;
  name: string;
  allergens: SavedAllergen[];
  /** Primary first, then oldest first. */
  contacts: ContactRow[];
  medications: MedicationRow[];
  /** ISO timestamp of the Supabase read this card was built from. */
  syncedAt: string;
};

export const OFFLINE_DB_NAME = "allergyguard";

export const offlineDb = new Dexie(OFFLINE_DB_NAME) as Dexie & {
  emergencyCards: EntityTable<EmergencyCard, "profileId">;
};

offlineDb.version(1).stores({
  emergencyCards: "profileId, ownerId",
});
