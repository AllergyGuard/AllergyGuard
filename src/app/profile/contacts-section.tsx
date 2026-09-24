"use client";

import { useState } from "react";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form-styles";
import { ContactFields } from "@/components/profile/contact-fields";
import { loadContacts } from "@/lib/profile/load";
import {
  addContact,
  deleteContact,
  setPrimaryContact,
  updateContact,
  SAVE_ERROR,
} from "@/lib/profile/save";
import type { ContactRow, ProfileRow } from "@/lib/profile/types";
import {
  hasErrors,
  validateContact,
  type ContactDraft,
  type FieldErrors,
} from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/client";
import { Section } from "./section";

type Mode =
  | { kind: "idle" }
  | { kind: "adding" }
  | { kind: "editing"; id: string }
  | { kind: "confirmDelete"; id: string };

const EMPTY: ContactDraft = { name: "", phone: "", relationship: "" };

const smallButton =
  "flex h-11 items-center rounded-lg px-3 text-sm font-medium";

type Props = { profile: ProfileRow; initial: ContactRow[] };

export function ContactsSection({ profile, initial }: Props) {
  const [supabase] = useState(createClient);
  const [contacts, setContacts] = useState<ContactRow[]>(initial);
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [draft, setDraft] = useState<ContactDraft>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<ContactDraft>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function start(next: Mode, fromDraft: ContactDraft = EMPTY) {
    setMode(next);
    setDraft(fromDraft);
    setErrors({});
    setStatus(null);
    setError(null);
  }

  /** Runs a save, then reloads the list so order and primary flags match the database. */
  async function run(work: () => Promise<{ ok: boolean; error?: string }>, success: () => string) {
    setBusy(true);
    setStatus(null);
    setError(null);
    const result = await work();
    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? SAVE_ERROR);
      return false;
    }
    try {
      setContacts(await loadContacts(supabase, profile.id));
    } catch {
      setError(SAVE_ERROR);
    }
    setBusy(false);
    setMode({ kind: "idle" });
    setStatus(success());
    return true;
  }

  function submitDraft() {
    const found = validateContact(draft);
    setErrors(found);
    if (hasErrors(found)) return;
    if (mode.kind === "adding") {
      const first = contacts.length === 0;
      run(
        () => addContact(supabase, profile.id, draft, first),
        () =>
          first
            ? `${draft.name.trim()} added as your primary contact.`
            : `${draft.name.trim()} added.`,
      );
    } else if (mode.kind === "editing") {
      const id = mode.id;
      run(() => updateContact(supabase, id, draft), () => "Contact saved.");
    }
  }

  function makePrimary(contact: ContactRow) {
    run(
      () => setPrimaryContact(supabase, contact.id),
      () => `${contact.name} is now your primary contact.`,
    );
  }

  function confirmDelete(contact: ContactRow) {
    let promotedId: string | null = null;
    let promotedName: string | null = null;
    run(
      async () => {
        const result = await deleteContact(supabase, contact.id);
        if (result.ok) {
          promotedId = result.data.promotedId;
          promotedName = contacts.find((c) => c.id === promotedId)?.name ?? null;
        }
        return result;
      },
      () =>
        promotedId && promotedName
          ? `${contact.name} deleted. ${promotedName} is now your primary contact.`
          : `${contact.name} deleted.`,
    );
  }

  const form = (title: string, submitLabel: string) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitDraft();
      }}
      noValidate
      aria-label={title}
      className="space-y-4 rounded-lg border border-emerald-200 p-3 dark:border-emerald-900"
    >
      <ContactFields
        idPrefix={mode.kind === "editing" ? `edit-${mode.id}` : "new-contact"}
        draft={draft}
        errors={errors}
        onChange={(field, value) => {
          setDraft((d) => ({ ...d, [field]: value }));
          setErrors((errs) => ({ ...errs, [field]: undefined }));
        }}
      />
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Saving…" : submitLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => start({ kind: "idle" })}
        className={secondaryButtonClass}
      >
        Cancel
      </button>
    </form>
  );

  return (
    <Section
      id="contacts"
      title="Emergency contacts"
      description="Your primary contact gets the call button on your emergency card."
      status={status}
      error={error}
    >
      {contacts.length === 0 && mode.kind !== "adding" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No emergency contacts yet.</p>
      )}

      <ul className="space-y-3">
        {contacts.map((contact) => (
          <li
            key={contact.id}
            className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
          >
            {mode.kind === "editing" && mode.id === contact.id ? (
              form(`Edit ${contact.name}`, "Save contact")
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                    {contact.name}
                  </span>
                  {contact.is_primary && (
                    <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white">
                      Primary
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  <a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`} className="underline">
                    {contact.phone}
                  </a>
                  {contact.relationship && ` · ${contact.relationship}`}
                </p>

                {mode.kind === "confirmDelete" && mode.id === contact.id ? (
                  <div role="group" aria-label={`Confirm deleting ${contact.name}`} className="mt-3 space-y-2">
                    <p className="text-sm text-zinc-900 dark:text-zinc-50">
                      Delete {contact.name}?
                      {contact.is_primary &&
                        contacts.length > 1 &&
                        " Your oldest other contact will become primary."}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => confirmDelete(contact)}
                        className={`${smallButton} bg-red-700 text-white`}
                      >
                        {busy ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => start({ kind: "idle" })}
                        className={`${smallButton} border border-zinc-300 dark:border-zinc-700`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {!contact.is_primary && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => makePrimary(contact)}
                        aria-label={`Make ${contact.name} primary`}
                        className={`${smallButton} text-emerald-700 dark:text-emerald-400`}
                      >
                        Make primary
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        start(
                          { kind: "editing", id: contact.id },
                          {
                            name: contact.name,
                            phone: contact.phone,
                            relationship: contact.relationship ?? "",
                          },
                        )
                      }
                      aria-label={`Edit ${contact.name}`}
                      className={`${smallButton} text-zinc-700 dark:text-zinc-300`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => start({ kind: "confirmDelete", id: contact.id })}
                      aria-label={`Delete ${contact.name}`}
                      className={`${smallButton} text-red-700 dark:text-red-400`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {mode.kind === "adding" ? (
        form("Add a contact", "Add contact")
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => start({ kind: "adding" })}
          className="h-12 w-full rounded-lg border border-dashed border-emerald-700 text-base font-semibold text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
        >
          + Add a contact
        </button>
      )}
    </Section>
  );
}
