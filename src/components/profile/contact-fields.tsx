"use client";

import { fieldErrorClass, inputClass, labelClass } from "@/components/form-styles";
import type { ContactDraft, FieldErrors } from "@/lib/profile/validation";

type Props = {
  /** Prefix for input ids, so several forms can be on one page. */
  idPrefix: string;
  draft: ContactDraft;
  errors: FieldErrors<ContactDraft>;
  onChange: (field: keyof ContactDraft, value: string) => void;
};

const FIELDS: {
  key: keyof ContactDraft;
  label: string;
  type: string;
  inputMode?: "tel";
  optional?: boolean;
}[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "phone", label: "Phone number", type: "tel", inputMode: "tel" },
  { key: "relationship", label: "Relationship", type: "text", optional: true },
];

/** Name / phone / relationship inputs. The parent owns state and validation. */
export function ContactFields({ idPrefix, draft, errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      {FIELDS.map((field) => {
        const id = `${idPrefix}-${field.key}`;
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
              autoComplete="off"
              placeholder={field.key === "phone" ? "+91 98765 43210" : undefined}
              value={draft[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
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
  );
}
