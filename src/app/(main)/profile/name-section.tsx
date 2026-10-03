"use client";

import { useState, type FormEvent } from "react";
import {
  fieldErrorClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/form-styles";
import { saveProfileName } from "@/lib/profile/save";
import type { ProfileRow } from "@/lib/profile/types";
import { validateProfileName } from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/client";
import { Section } from "./section";

export function NameSection({ initial }: { initial: ProfileRow }) {
  const [supabase] = useState(createClient);
  const [profile, setProfile] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    const invalid = validateProfileName(name);
    setFieldError(invalid);
    if (invalid) return;
    setBusy(true);
    const result = await saveProfileName(supabase, profile, name);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setProfile(result.data);
    setName(result.data.name);
    setStatus("Name saved.");
  }

  return (
    <Section id="name" title="Profile name" status={status} error={error}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="profile-name" className={labelClass}>
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFieldError(null);
              setStatus(null);
            }}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "profile-name-error" : undefined}
            className={inputClass}
          />
          {fieldError && (
            <p id="profile-name-error" className={fieldErrorClass}>
              {fieldError}
            </p>
          )}
        </div>
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Saving…" : "Save name"}
        </button>
      </form>
    </Section>
  );
}
