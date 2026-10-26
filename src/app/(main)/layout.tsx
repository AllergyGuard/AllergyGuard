import { AppBar } from "@/components/ui/app-bar";
import { BottomTabs } from "@/components/ui/bottom-tabs";
import { createClient } from "@/lib/supabase/server";

// Every page except /emergency and /~offline. Reading the auth cookies here
// makes these pages render per request; keeping it out of the root layout lets
// /emergency be a static page the service worker precaches.
export default async function MainLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <>
      <AppBar signedIn={signedIn} />
      {children}
      {signedIn && <BottomTabs />}
    </>
  );
}
