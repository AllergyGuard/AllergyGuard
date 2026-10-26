import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { secondaryButtonClass } from "@/components/form-styles";
import { AuthFrame, OrDivider } from "@/components/ui/auth-frame";
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
    <AuthFrame
      title="Create your account"
      subtitle={`Save your allergy profile so ${APP_NAME} can check products for you.`}
    >
      {error === "confirmation_failed" && (
        <p
          role="alert"
          className="mt-6 rounded-field border border-caution-ink/30 bg-caution-band p-3 text-sm font-semibold text-caution-ink"
        >
          That confirmation link has expired or was already used. Sign up
          again below and we&apos;ll send you a fresh link.
        </p>
      )}

      <SignupForm />

      <OrDivider />
      <p className="sr-only">Already have an account?</p>
      <Link href="/login" className={secondaryButtonClass}>
        Log in
      </Link>
    </AuthFrame>
  );
}
