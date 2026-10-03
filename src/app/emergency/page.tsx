import type { Metadata } from "next";
import { EmergencyCardView } from "./emergency-card-view";

export const metadata: Metadata = { title: "Emergency" };

// A static page: no server data, no auth. The service worker precaches its
// HTML at install, and the card itself is read from Dexie in the browser, so
// this works after a hard reload with no network at all.
export default function EmergencyPage() {
  return (
    <main className="flex flex-1 flex-col bg-white px-4 pb-10 pt-4 dark:bg-black">
      <div className="mx-auto w-full max-w-sm">
        {/* Plain <a>, a full document load: /emergency has its own layout tree,
            and when offline the service worker answers with /~offline. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="inline-flex h-11 items-center text-sm font-medium text-zinc-700 underline underline-offset-4 dark:text-zinc-300"
        >
          ← Back to AllergyGuard
        </a>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-red-700 dark:text-red-400">
          Emergency
        </h1>
        <EmergencyCardView />
      </div>
    </main>
  );
}
