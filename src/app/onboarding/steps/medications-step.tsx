"use client";

import { useRef, useState } from "react";
import { fieldErrorClass, inputClass, labelClass } from "@/components/form-styles";
import type { MedicationDraft } from "@/lib/profile/medications";
import {
  hasErrors,
  isExpired,
  todayIso,
  validateMedication,
  type FieldErrors,
  type MedicationFields,
} from "@/lib/profile/validation";
import { StepShell } from "./step-shell";

type Props = {
  initial: readonly MedicationDraft[];
  onSave: (drafts: MedicationDraft[]) => Promise<string | null>;
  onBack: () => void;
};

const isBlank = (d: MedicationDraft) =>
  d.name.trim() === "" && d.dose.trim() === "" && d.expiryDate === "";

export function MedicationsStep({ initial, onSave, onBack }: Props) {
  const [drafts, setDrafts] = useState<MedicationDraft[]>([...initial]);
  const [errors, setErrors] = useState<Record<string, FieldErrors<MedicationFields>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nextKey = useRef(0);
  const today = todayIso();

  function update(key: string, field: keyof MedicationFields, value: string) {
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, [field]: value } : d)));
    setErrors((errs) => ({ ...errs, [key]: { ...errs[key], [field]: undefined } }));
  }

  async function handleSubmit() {
    // Silently drop cards the user added but left completely empty.
    const kept = drafts.filter((d) => !isBlank(d));
    const found: Record<string, FieldErrors<MedicationFields>> = {};
    for (const d of kept) {
      const e = validateMedication(d);
      if (hasErrors(e)) found[d.key] = e;
    }
    setDrafts(kept);
    setErrors(found);
    setSaveError(null);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    const result = await onSave(kept);
    if (result) {
      setSaveError(result);
      setBusy(false);
    }
  }

  return (
    <StepShell
      step={5}
      title="Medications"
      description="Add any allergy medication you carry, like an adrenaline auto-injector or antihistamine. You can skip this."
      primaryLabel="Finish setup"
      busy={busy}
      error={saveError}
      onSubmit={handleSubmit}
      onBack={onBack}
    >
      <ul className="space-y-4">
        {drafts.map((draft, index) => {
          const e = errors[draft.key] ?? {};
          const id = (field: string) => `med-${draft.key}-${field}`;
          const label = draft.name.trim() || `Medication ${index + 1}`;
          return (
            <li
              key={draft.key}
              className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <label htmlFor={id("name")} className={labelClass}>
                  Name
                </label>
                <input
                  id={id("name")}
                  type="text"
                  value={draft.name}
                  onChange={(ev) => update(draft.key, "name", ev.target.value)}
                  placeholder="e.g. EpiPen"
                  aria-invalid={e.name ? true : undefined}
                  aria-describedby={e.name ? id("name-error") : undefined}
                  className={inputClass}
                />
                {e.name && (
                  <p id={id("name-error")} className={fieldErrorClass}>
                    {e.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={id("dose")} className={labelClass}>
                  Dose <span className="font-normal text-zinc-500 dark:text-zinc-400">(optional)</span>
                </label>
                <input
                  id={id("dose")}
                  type="text"
                  value={draft.dose}
                  onChange={(ev) => update(draft.key, "dose", ev.target.value)}
                  placeholder="e.g. 0.3 mg"
                  aria-invalid={e.dose ? true : undefined}
                  aria-describedby={e.dose ? id("dose-error") : undefined}
                  className={inputClass}
                />
                {e.dose && (
                  <p id={id("dose-error")} className={fieldErrorClass}>
                    {e.dose}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={id("expiry")} className={labelClass}>
                  Expiry date{" "}
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">(optional)</span>
                </label>
                <input
                  id={id("expiry")}
                  type="date"
                  value={draft.expiryDate}
                  onChange={(ev) => update(draft.key, "expiryDate", ev.target.value)}
                  aria-invalid={e.expiryDate ? true : undefined}
                  aria-describedby={
                    e.expiryDate ? id("expiry-error") : isExpired(draft.expiryDate, today) ? id("expiry-warning") : undefined
                  }
                  className={inputClass}
                />
                {e.expiryDate ? (
                  <p id={id("expiry-error")} className={fieldErrorClass}>
                    {e.expiryDate}
                  </p>
                ) : (
                  isExpired(draft.expiryDate, today) && (
                    <p id={id("expiry-warning")} className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-300">
                      This has expired. Please replace it as soon as you can.
                    </p>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrafts((ds) => ds.filter((d) => d.key !== draft.key));
                  setErrors((errs) => {
                    const rest = { ...errs };
                    delete rest[draft.key];
                    return rest;
                  });
                }}
                aria-label={`Remove ${label}`}
                className="flex h-11 items-center text-sm font-medium text-red-700 dark:text-red-400"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() =>
          setDrafts((ds) => [
            ...ds,
            { key: `new-${nextKey.current++}`, name: "", dose: "", expiryDate: "" },
          ])
        }
        className="h-12 w-full rounded-lg border border-dashed border-emerald-700 text-base font-semibold text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
      >
        + Add a medication
      </button>
    </StepShell>
  );
}
