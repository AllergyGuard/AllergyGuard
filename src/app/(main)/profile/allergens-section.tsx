"use client";

import { useState } from "react";
import { AllergenPicker } from "@/components/allergen-picker";
import { fieldErrorClass, primaryButtonClass } from "@/components/form-styles";
import type { AllergenSelection, SavedAllergen } from "@/lib/profile/allergen-selection";
import { saveAllergens } from "@/lib/profile/save";
import type { ProfileRow } from "@/lib/profile/types";
import { validateAllergenList } from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/client";
import { Section } from "./section";

type Props = { profile: ProfileRow; initial: SavedAllergen[] };

export function AllergensSection({ profile, initial }: Props) {
  const [supabase] = useState(createClient);
  const [saved, setSaved] = useState<SavedAllergen[]>(initial);
  const [value, setValue] = useState<AllergenSelection[]>(initial);
  const [listError, setListError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setStatus(null);
    setError(null);
    const invalid = validateAllergenList(value);
    setListError(invalid);
    if (invalid) return;
    setBusy(true);
    const result = await saveAllergens(supabase, profile, saved, value);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSaved(result.data.allergens);
    setValue(result.data.allergens);
    setStatus("Allergies saved.");
  }

  return (
    <Section tone="allergy"
      id="allergies"
      title="Allergies"
      description="Every product is checked against this list."
      status={status}
      error={error}
    >
      <AllergenPicker
        value={value}
        onChange={(next) => {
          setValue(next);
          setStatus(null);
          if (next.length > 0) setListError(null);
        }}
      />
      {listError && (
        <p role="alert" className={fieldErrorClass}>
          {listError}
        </p>
      )}
      <button type="button" onClick={handleSave} disabled={busy} className={primaryButtonClass}>
        {busy ? "Saving…" : "Save allergies"}
      </button>
    </Section>
  );
}
