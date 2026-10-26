"use client";

import { useState } from "react";
import { InputWithIcon } from "@/components/ui/field";
import { PersonIcon } from "@/components/ui/icons";
import { fieldErrorClass, inputClass, labelClass } from "@/components/form-styles";
import { validateProfileName } from "@/lib/profile/validation";
import { StepShell } from "./step-shell";

type Props = {
  initialName: string;
  /** Resolves to an error message, or null on success. */
  onSave: (name: string) => Promise<string | null>;
  onBack: () => void;
};

export function NameStep({ initialName, onSave, onBack }: Props) {
  const [name, setName] = useState(initialName);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    const error = validateProfileName(name);
    setFieldError(error);
    setSaveError(null);
    if (error) return;
    setBusy(true);
    const result = await onSave(name);
    if (result) {
      setSaveError(result);
      setBusy(false);
    }
  }

  return (
    <StepShell
      step={2}
      title="Who is this profile for?"
      description="Usually that's you. This name is shown on your emergency card."
      primaryLabel="Continue"
      busy={busy}
      error={saveError}
      onSubmit={handleSubmit}
      onBack={onBack}
    >
      <div>
        <label htmlFor="profile-name" className={labelClass}>
          Name
        </label>
        <InputWithIcon icon={<PersonIcon className="size-5" />}>
          <input
            id="profile-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFieldError(null);
            }}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "profile-name-error" : undefined}
            className={`${inputClass} pr-12`}
          />
        </InputWithIcon>
        {fieldError && (
          <p id="profile-name-error" className={fieldErrorClass}>
            {fieldError}
          </p>
        )}
      </div>
    </StepShell>
  );
}
