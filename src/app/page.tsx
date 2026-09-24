import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const primaryLinkClass =
  "flex h-12 w-full max-w-xs items-center justify-center rounded-lg bg-emerald-700 text-base font-semibold text-white";
const secondaryLinkClass =
  "flex h-12 w-full max-w-xs items-center justify-center rounded-lg border border-zinc-300 text-base font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {APP_NAME}
      </h1>
      <p className="mt-3 max-w-xs text-base text-zinc-600 dark:text-zinc-400">
        Scan a product, know if it&apos;s safe for you.
      </p>
      <div className="mt-8 flex w-full flex-col items-center gap-3">
        {signedIn ? (
          <Link href="/onboarding" className={primaryLinkClass}>
            Continue setup
          </Link>
        ) : (
          <>
            <Link href="/signup" className={primaryLinkClass}>
              Create account
            </Link>
            <Link href="/login" className={secondaryLinkClass}>
              Log in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
