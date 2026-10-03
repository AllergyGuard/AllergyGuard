// Pure display helpers for the /emergency card.

import type { Severity } from "@/lib/allergen/codes";
import type { SavedAllergen } from "@/lib/profile/allergen-selection";

const SEVERITY_RANK: Record<Severity, number> = { severe: 0, moderate: 1, mild: 2 };

/**
 * Order allergies are listed on the card: the ones a responder most needs to
 * see come first. Severe, then moderate, then mild, then "not set"; ties keep
 * the order the user added them in (Array.prototype.sort is stable).
 */
export function sortAllergensForCard(allergens: readonly SavedAllergen[]): SavedAllergen[] {
  const rank = (a: SavedAllergen) => (a.severity === null ? 3 : SEVERITY_RANK[a.severity]);
  return [...allergens].sort((a, b) => rank(a) - rank(b));
}

/** "3 Oct 2026, 15:00" in the device's locale and time zone. */
export function formatSyncedAt(syncedAt: string, locale?: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(syncedAt));
}
