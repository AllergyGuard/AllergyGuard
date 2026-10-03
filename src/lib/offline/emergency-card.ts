// Keeps the Dexie emergency card in step with Supabase, and reads it back for
// /emergency. Every write path (profile saves and the app-load sync) goes
// through syncEmergencyCard(), so the card is always a full fresh snapshot.

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadContacts, loadOwnProfile } from "@/lib/profile/load";
import type { ContactRow, ProfileBundle } from "@/lib/profile/types";
import { offlineDb, type EmergencyCard } from "./db";

/** Pure: the card for one profile, from rows already loaded from Supabase. */
export function buildEmergencyCard(
  ownerId: string,
  bundle: ProfileBundle,
  contacts: readonly ContactRow[],
  syncedAt: Date,
): EmergencyCard {
  return {
    profileId: bundle.profile.id,
    ownerId,
    name: bundle.profile.name,
    allergens: [...bundle.allergens],
    // loadContacts() already orders primary first; sort again so the card
    // never depends on query order.
    contacts: [...contacts].sort((a, b) => Number(b.is_primary) - Number(a.is_primary)),
    medications: [...bundle.medications],
    syncedAt: syncedAt.toISOString(),
  };
}

/**
 * Re-reads the signed-in user's profile from Supabase and replaces the card.
 * Also drops cards that belong to anyone else (e.g. a previous user whose
 * session expired without an explicit sign-out).
 *
 * Never throws: a failed mirror must not turn a successful save into an
 * error. It returns false instead, and the next app load retries.
 *
 * Does nothing (returns false) when there is no session, so an expired
 * session or an offline read never clears the existing card.
 */
export async function syncEmergencyCard(
  supabase: SupabaseClient,
  now: () => Date = () => new Date(),
): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getClaims();
    const ownerId = data?.claims?.sub;
    if (!ownerId) return false;

    const bundle = await loadOwnProfile(supabase);
    if (!bundle) return false;
    const contacts = await loadContacts(supabase, bundle.profile.id);
    const card = buildEmergencyCard(ownerId, bundle, contacts, now());

    await offlineDb.transaction("rw", offlineDb.emergencyCards, async () => {
      await offlineDb.emergencyCards.where("ownerId").notEqual(ownerId).delete();
      await offlineDb.emergencyCards.put(card);
    });
    await requestPersistentStorage();
    return true;
  } catch (error) {
    console.error("Emergency card sync failed", error);
    return false;
  }
}

/**
 * Asks the browser not to evict our storage under pressure. Only called after
 * a card has been written, so the permission is tied to data worth keeping.
 * Browsers may say no (Safari often does); that is not an error.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** All cards on this device. Reads Dexie only, never the network. */
export function readEmergencyCards(): Promise<EmergencyCard[]> {
  return offlineDb.emergencyCards.toArray();
}

/** Explicit sign-out only (CLAUDE.md + Phase 2 decision): wipes every card. */
export function clearEmergencyCards(): Promise<void> {
  return offlineDb.emergencyCards.clear();
}
