import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { linkClass } from "@/components/form-styles";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: `Create account · ${APP_NAME}`,
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/onboarding");

  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create your account
        </h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Save your allergy profile so {APP_NAME} can check products for you.
        </p>

        {error === "confirmation_failed" && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
          >
            That confirmation link has expired or was already used. Sign up
            again below and we&apos;ll send you a fresh link.
          </p>
        )}

        <SignupForm />

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className={linkClass}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
