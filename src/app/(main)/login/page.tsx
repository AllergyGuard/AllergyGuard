import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { linkClass } from "@/components/form-styles";
import { safeNextPath } from "@/lib/auth/redirect";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: `Log in · ${APP_NAME}`,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; logged_out?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "/");

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect(next);

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Log in
        </h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Welcome back to {APP_NAME}.
        </p>

        {params.logged_out === "1" && (
          <p
            role="status"
            className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          >
            You&apos;ve been logged out.
          </p>
        )}

        <LoginForm next={next} />

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          New to {APP_NAME}?{" "}
          <Link href="/signup" className={linkClass}>
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
