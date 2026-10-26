"use client";

import { useState } from "react";
import { primaryButtonClass } from "@/components/form-styles";
import {
  MedicationListEditor,
  useMedicationList,
} from "@/components/profile/medication-list-editor";
import { fromMedicationRow } from "@/lib/profile/medications";
import { saveMedications } from "@/lib/profile/save";
import type { MedicationRow, ProfileRow } from "@/lib/profile/types";
import { createClient } from "@/lib/supabase/client";
import { Section } from "./section";

type Props = { profile: ProfileRow; initial: MedicationRow[] };

export function MedicationsSection({ profile, initial }: Props) {
  const [supabase] = useState(createClient);
  const [saved, setSaved] = useState<MedicationRow[]>(initial);
  const list = useMedicationList(initial.map(fromMedicationRow));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setStatus(null);
    setError(null);
    const kept = list.validate();
    if (!kept) return;
    setBusy(true);
    const result = await saveMedications(supabase, profile, saved, kept);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSaved(result.data);
    list.reset(result.data.map(fromMedicationRow));
    setStatus("Medications saved.");
  }

  return (
    <Section tone="medication"
      id="medications"
      title="Medications"
      description="Medication you carry for your allergies. Add an expiry date to get reminders later."
      status={status}
      error={error}
    >
      <MedicationListEditor {...list.editor} />
      <button type="button" onClick={handleSave} disabled={busy} className={primaryButtonClass}>
        {busy ? "Saving…" : "Save medications"}
      </button>
    </Section>
  );
}
