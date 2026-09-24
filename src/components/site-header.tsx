import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

// Persistent top bar. Phase 2 adds the emergency button here.
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
        {signedIn ? (
          <div className="flex items-center gap-1">
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
          </div>
        ) : (
          <Link
            href="/login"
            className="flex h-11 items-center px-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
