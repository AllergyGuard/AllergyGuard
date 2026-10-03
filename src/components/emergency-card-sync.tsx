"use client";

import { useEffect } from "react";
import { syncEmergencyCard } from "@/lib/offline/emergency-card";
import { createClient } from "@/lib/supabase/client";

// Refreshes the offline emergency card once per full page load while signed
// in. Covers accounts created before Phase 2 and edits made on other devices.
// Renders nothing; failures are logged inside syncEmergencyCard().
export function EmergencyCardSync() {
  useEffect(() => {
    void syncEmergencyCard(createClient());
  }, []);
  return null;
}
