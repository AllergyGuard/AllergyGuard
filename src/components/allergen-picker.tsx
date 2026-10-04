"use client";

import { useId, useState, type KeyboardEvent } from "react";
import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  SEVERITIES,
  SEVERITY_LABELS,
  type AllergenCode,
  type Severity,
} from "@/lib/allergen/codes";
import {
  addCustom,
  isSelected,
  normalizeCustomName,
  removeSelection,
  replaceWithPredefined,
  selectionKey,
  selectionLabel,
  setSeverity,
  synonymSuggestion,
  toggleAllergen,
  validateCustomAllergen,
  type AllergenSelection,
} from "@/lib/profile/allergen-selection";
import { fieldErrorClass, inputClass, labelClass } from "./form-styles";

type Props = {
  value: readonly AllergenSelection[];
  onChange: (next: AllergenSelection[]) => void;
};

const SEVERITY_OPTIONS: { value: Severity | null; label: string }[] = [
  { value: null, label: "Not sure" },
  ...SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABELS[s] })),
];

/**
 * Controlled allergen editor: predefined chips, custom free-text allergens,
 * and an optional severity for each. It never talks to the database; the
 * parent owns saving (see diffAllergens in lib/profile/allergen-selection).
 */
export function AllergenPicker({ value, onChange }: Props) {
  const id = useId();
  const [customName, setCustomName] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  // Shown after adding a synonym of a predefined allergen ("dairy" → Milk).
  const [suggestion, setSuggestion] = useState<{ name: string; code: AllergenCode } | null>(
    null,
  );

  function handleAddCustom() {
    const error = validateCustomAllergen(customName, value);
    setCustomError(error);
    if (error) return;
    const name = normalizeCustomName(customName);
    const code = synonymSuggestion(value, name);
    setSuggestion(code ? { name, code } : null);
    onChange(addCustom(value, customName));
    setCustomName("");
  }

  function applySuggestion() {
    if (!suggestion) return;
    const key = selectionKey({ kind: "custom", name: suggestion.name, severity: null });
    onChange(replaceWithPredefined(value, key, suggestion.code));
    setSuggestion(null);
  }

  function handleCustomKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // The picker usually sits inside a larger form: Enter adds, not submits.
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddCustom();
    }
  }

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Common allergens
        </legend>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Tap everything you&apos;re allergic to.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ALLERGEN_CODES.map((code) => {
            const selected = isSelected(value, code);
            return (
              <button
                key={code}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(toggleAllergen(value, code))}
                className={
                  "flex min-h-12 items-center justify-center rounded-lg border px-3 text-base font-medium " +
                  (selected
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50")
                }
              >
                {selected && <span aria-hidden="true" className="mr-1">✓</span>}
                {ALLERGEN_LABELS[code]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${id}-custom`} className={labelClass}>
          Something else?
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id={`${id}-custom`}
            type="text"
            value={customName}
            onChange={(e) => {
              setCustomName(e.target.value);
              setCustomError(null);
              setSuggestion(null);
            }}
            onKeyDown={handleCustomKeyDown}
            placeholder="e.g. Lupin, kiwi"
            autoComplete="off"
            aria-invalid={customError ? true : undefined}
            aria-describedby={customError ? `${id}-custom-error` : undefined}
            className={`${inputClass} mt-0 flex-1`}
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="h-12 shrink-0 rounded-lg border border-emerald-700 px-4 text-base font-semibold text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
          >
            Add
          </button>
        </div>
        {customError && (
          <p id={`${id}-custom-error`} role="alert" className={fieldErrorClass}>
            {customError}
          </p>
        )}
        {suggestion && (
          <div
            role="status"
            className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          >
            <p>
              Did you mean {ALLERGEN_LABELS[suggestion.code]}? Ticking it also covers
              &ldquo;{suggestion.name}&rdquo; and its other names.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applySuggestion}
                className="min-h-11 rounded-lg bg-emerald-700 px-4 font-semibold text-white"
              >
                Use {ALLERGEN_LABELS[suggestion.code]} instead
              </button>
              <button
                type="button"
                onClick={() => setSuggestion(null)}
                className="min-h-11 rounded-lg px-4 font-medium text-emerald-800 dark:text-emerald-300"
              >
                Keep {suggestion.name}
              </button>
            </div>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <section aria-labelledby={`${id}-selected`}>
          <h3
            id={`${id}-selected`}
            className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Your allergens ({value.length})
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            How severe is your reaction? This is shown on your emergency card.
          </p>
          <ul className="mt-3 space-y-3">
            {value.map((selection, index) => {
              const key = selectionKey(selection);
              const label = selectionLabel(selection);
              const groupName = `${id}-severity-${index}`;
              return (
                <li
                  key={key}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange(removeSelection(value, key))}
                      aria-label={`Remove ${label}`}
                      className="flex h-11 items-center px-2 text-sm font-medium text-red-700 dark:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                  <div
                    role="radiogroup"
                    aria-label={`${label} severity`}
                    className="mt-2 grid grid-cols-4 gap-1"
                  >
                    {SEVERITY_OPTIONS.map((option) => {
                      const checked = selection.severity === option.value;
                      return (
                        <label
                          key={option.label}
                          className={
                            "flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-1 text-center text-sm " +
                            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600 " +
                            (checked
                              ? "border-emerald-700 bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                              : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300")
                          }
                        >
                          <input
                            type="radio"
                            name={groupName}
                            checked={checked}
                            onChange={() => onChange(setSeverity(value, key, option.value))}
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
