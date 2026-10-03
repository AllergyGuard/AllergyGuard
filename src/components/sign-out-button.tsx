"use client";

import { signOut } from "@/app/auth/actions";
import { clearEmergencyCards } from "@/lib/offline/emergency-card";

// The only place the offline emergency card is wiped: an explicit sign-out
// (Phase 2 decision). Session expiry, a failed token refresh or being offline
// never reach this code, so they keep the card.
//
// No runtime cache needs clearing here: the service worker never stores
// signed-in pages or API responses (see src/app/sw.ts).
async function clearThenSignOut() {
  try {
    await clearEmergencyCards();
  } catch (error) {
    console.error("Could not clear the offline emergency card", error);
  }
  await signOut();
}

export function SignOutButton({ className }: { className: string }) {
  return (
    <form action={clearThenSignOut}>
      <button type="submit" className={className}>
        Log out
      </button>
    </form>
  );
}
