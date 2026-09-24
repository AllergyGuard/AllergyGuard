import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Welcome · ${APP_NAME}`,
};

// Placeholder: the real setup wizard is US-03.
export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?next=/onboarding");

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your email is confirmed
        </h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Welcome to {APP_NAME}. Setting up your allergy profile is coming soon.
        </p>
      </div>
    </main>
  );
}
