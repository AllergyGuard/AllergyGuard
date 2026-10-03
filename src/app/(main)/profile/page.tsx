import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { loadContacts, loadOwnProfile } from "@/lib/profile/load";
import { createClient } from "@/lib/supabase/server";
import { AllergensSection } from "./allergens-section";
import { ContactsSection } from "./contacts-section";
import { MedicationsSection } from "./medications-section";
import { NameSection } from "./name-section";

export const metadata: Metadata = {
  title: `Your profile · ${APP_NAME}`,
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?next=/profile");

  const bundle = await loadOwnProfile(supabase);
  if (!bundle || bundle.profile.onboarding_completed_at === null) redirect("/onboarding");
  const contacts = await loadContacts(supabase, bundle.profile.id);

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your profile
        </h1>
        <NameSection initial={bundle.profile} />
        <AllergensSection profile={bundle.profile} initial={bundle.allergens} />
        <ContactsSection profile={bundle.profile} initial={contacts} />
        <MedicationsSection profile={bundle.profile} initial={bundle.medications} />
      </div>
    </main>
  );
}
