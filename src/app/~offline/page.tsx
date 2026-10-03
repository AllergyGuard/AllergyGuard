import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline" };

// Served by the service worker when a page can't load without a network.
// Static and precached; contains no user data.
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-white px-4 text-center dark:bg-black">
      <div className="max-w-xs space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">You&apos;re offline</h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          This page needs an internet connection. Your emergency card works offline.
        </p>
      </div>
      {/* Plain <a>: a full load the service worker answers from its cache. */}
      <a
        href="/emergency"
        className="flex h-14 w-full max-w-xs items-center justify-center rounded-xl bg-red-700 text-lg font-bold text-white"
      >
        Open emergency card
      </a>
    </main>
  );
}
