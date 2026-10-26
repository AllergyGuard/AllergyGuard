import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { loadContacts, loadOwnProfile } from "@/lib/profile/load";
import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "./profile-view";

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

  return <ProfileView bundle={bundle} contacts={contacts} />;
}
