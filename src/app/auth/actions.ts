"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Ends the session server-side (clears the auth cookies) and returns to login.
// A Server Action is a POST, so a link elsewhere can't log the user out.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?logged_out=1");
}
