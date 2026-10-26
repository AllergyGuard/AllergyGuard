import Link from "next/link";
import { redirect } from "next/navigation";
import { primaryButtonClass, secondaryButtonClass } from "@/components/form-styles";
import { AppIconTile } from "@/components/ui/icons";
import { APP_NAME } from "@/lib/constants";
import { loadOwnProfile } from "@/lib/profile/load";
import { createClient } from "@/lib/supabase/server";
import { HomeDashboard } from "./home-dashboard";
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return (
      <main className="flex flex-1 flex-col bg-page">
        <div className="flex flex-col items-center gap-3 rounded-b-[32px] bg-band px-4 pb-10 pt-10 text-center">
          <AppIconTile size="lg" />
          <h1 className="text-[28px] font-black uppercase tracking-[0.08em] text-primary-ink">{APP_NAME}</h1>
          <p className="max-w-xs text-base font-semibold text-muted">
            Scan a product, know if it&apos;s safe for you.
          </p>
        </div>
        <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3 px-4">
          <Link href="/signup" className={primaryButtonClass}>
            Create account
          </Link>
          <Link href="/login" className={secondaryButtonClass}>
            Log in
          </Link>
        </div>
      </main>
    );
  }

  const bundle = await loadOwnProfile(supabase);
  if (!bundle || bundle.profile.onboarding_completed_at === null) redirect("/onboarding");

  return <HomeDashboard bundle={bundle} />;
}
