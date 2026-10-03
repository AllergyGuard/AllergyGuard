import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

// Persistent top bar on every page except /emergency itself.
//
// The Emergency button is a plain <a>, not <Link>: <Link> fetches the RSC
// payload over the network, which fails offline. A full document load is
// answered from the service worker's precache instead.
function EmergencyButton() {
  return (
    <a
      href="/emergency"
      className="flex h-11 items-center rounded-lg bg-red-700 px-3 text-sm font-semibold text-white"
    >
      Emergency
    </a>
  );
}

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-1">
          {signedIn ? (
            <>
              <Link
                href="/profile"
                className="flex h-11 items-center px-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Profile
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex h-11 items-center px-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-11 items-center px-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
            >
              Log in
            </Link>
          )}
          <EmergencyButton />
        </div>
      </div>
    </header>
  );
}
