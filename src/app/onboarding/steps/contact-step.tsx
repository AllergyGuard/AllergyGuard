"use client";

import { useState } from "react";
import { fieldErrorClass, inputClass, labelClass } from "@/components/form-styles";
import {
  hasErrors,
  validateContact,
  type ContactDraft,
  type FieldErrors,
} from "@/lib/profile/validation";
import { StepShell } from "./step-shell";

type Props = {
  initial: ContactDraft;
  onSave: (draft: ContactDraft) => Promise<string | null>;
  onSkip: () => Promise<string | null>;
  onBack: () => void;
};

const FIELDS: {
  key: keyof ContactDraft;
  label: string;
  type: string;
  autoComplete: string;
  inputMode?: "tel";
  optional?: boolean;
}[] = [
  { key: "name", label: "Name", type: "text", autoComplete: "off" },
  { key: "phone", label: "Phone number", type: "tel", autoComplete: "off", inputMode: "tel" },
  { key: "relationship", label: "Relationship", type: "text", autoComplete: "off", optional: true },
];

export function ContactStep({ initial, onSave, onSkip, onBack }: Props) {
  const [draft, setDraft] = useState<ContactDraft>(initial);
  const [errors, setErrors] = useState<FieldErrors<ContactDraft>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string | null>) {
    setSaveError(null);
    setBusy(true);
    const result = await action();
    if (result) {
      setSaveError(result);
      setBusy(false);
    }
  }

  return (
    <StepShell
      step={4}
      title="Emergency contact"
      description="Who should be called in an emergency? They'll get a one-tap call button on your emergency card."
      primaryLabel="Save and continue"
      busy={busy}
      error={saveError}
      onSubmit={() => {
        const found = validateContact(draft);
        setErrors(found);
        if (!hasErrors(found)) run(() => onSave(draft));
      }}
      secondary={{
        label: "Add later",
        onClick: () => {
          setErrors({});
          run(onSkip);
        },
      }}
      onBack={onBack}
    >
      <div className="space-y-5">
        {FIELDS.map((field) => {
          const id = `contact-${field.key}`;
          const error = errors[field.key];
          return (
            <div key={field.key}>
              <label htmlFor={id} className={labelClass}>
                {field.label}
                {field.optional && (
                  <span className="font-normal text-zinc-500 dark:text-zinc-400"> (optional)</span>
                )}
              </label>
              <input
                id={id}
                type={field.type}
                inputMode={field.inputMode}
                autoComplete={field.autoComplete}
                placeholder={field.key === "phone" ? "+91 98765 43210" : undefined}
                value={draft[field.key]}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, [field.key]: e.target.value }));
                  setErrors((errs) => ({ ...errs, [field.key]: undefined }));
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={inputClass}
              />
              {error && (
                <p id={`${id}-error`} className={fieldErrorClass}>
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </StepShell>
  );
}
