import Link from "next/link";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { selectionLabel } from "@/lib/profile/allergen-selection";
import { loadOwnProfile } from "@/lib/profile/load";
import { createClient } from "@/lib/supabase/server";

const primaryLinkClass =
  "flex h-12 w-full max-w-xs items-center justify-center rounded-lg bg-emerald-700 text-base font-semibold text-white";
const secondaryLinkClass =
  "flex h-12 w-full max-w-xs items-center justify-center rounded-lg border border-zinc-300 text-base font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 text-center dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {APP_NAME}
        </h1>
        <p className="mt-3 max-w-xs text-base text-zinc-600 dark:text-zinc-400">
          Scan a product, know if it&apos;s safe for you.
        </p>
        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <Link href="/signup" className={primaryLinkClass}>
            Create account
          </Link>
          <Link href="/login" className={secondaryLinkClass}>
            Log in
          </Link>
        </div>
      </main>
    );
  }

  const bundle = await loadOwnProfile(supabase);
  if (!bundle || bundle.profile.onboarding_completed_at === null) redirect("/onboarding");

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hi, {bundle.profile.name}
        </h1>

        {!bundle.primaryContact && (
          <div
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50"
          >
            <p className="font-semibold">Add an emergency contact</p>
            <p className="mt-1 text-sm">
              Your emergency card has no one to call yet.{" "}
              <Link href="/profile#contacts" className="font-semibold underline underline-offset-2">
                Add a contact
              </Link>
            </p>
          </div>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Your allergies
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {bundle.allergens.map((a) => (
              <li
                key={a.id}
                className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
              >
                {selectionLabel(a)}
              </li>
            ))}
          </ul>
        </section>

        <Link href="/profile" className={secondaryLinkClass}>
          Edit profile
        </Link>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Product scanning is coming soon.
        </p>
      </div>
    </main>
  );
}
