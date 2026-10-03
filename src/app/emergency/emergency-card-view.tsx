"use client";

import { useEffect, useState } from "react";
import { InstallHint } from "@/components/install-hint";
import { SEVERITY_LABELS } from "@/lib/allergen/codes";
import { formatSyncedAt, sortAllergensForCard } from "@/lib/offline/card-format";
import type { EmergencyCard } from "@/lib/offline/db";
import { readEmergencyCards } from "@/lib/offline/emergency-card";
import { selectionLabel } from "@/lib/profile/allergen-selection";
import { telHref } from "@/lib/profile/phone";
import { isExpired, todayIso } from "@/lib/profile/validation";

type State =
  | { status: "loading" }
  | { status: "ready"; cards: EmergencyCard[] }
  | { status: "unavailable" };

const sectionTitle = "text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

/** Reads the card from Dexie only. Never touches the network. */
export function EmergencyCardView() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    readEmergencyCards().then(
      (cards) => setState({ status: "ready", cards }),
      (error) => {
        console.error("Could not read the offline emergency card", error);
        setState({ status: "unavailable" });
      },
    );
  }, []);

  if (state.status === "loading") {
    return <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">Loading…</p>;
  }
  if (state.status === "unavailable" || state.cards.length === 0) {
    return (
      <div className="mt-6 space-y-3 text-base text-zinc-700 dark:text-zinc-300">
        <p className="font-semibold">No emergency info saved on this device.</p>
        <p>
          {state.status === "unavailable"
            ? "This browser isn't letting AllergyGuard store data (private browsing can do this)."
            : "Log in while you have internet once, and your allergies, medications and emergency contact are saved here for offline use."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-8">
      <InstallHint />
      {state.cards.map((card) => (
        <CardDetails key={card.profileId} card={card} />
      ))}
    </div>
  );
}

function CardDetails({ card }: { card: EmergencyCard }) {
  const [primary, ...others] = card.contacts;
  const today = todayIso();

  return (
    <article className="space-y-6" aria-labelledby={`card-${card.profileId}`}>
      <h2 id={`card-${card.profileId}`} className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {card.name}
      </h2>

      {primary ? (
        <a
          href={telHref(primary.phone)}
          className="flex min-h-16 w-full flex-col items-center justify-center rounded-xl bg-red-700 px-4 py-3 text-center text-white"
        >
          <span className="text-xl font-bold">Call {primary.name}</span>
          <span className="text-base">
            {primary.relationship ? `${primary.relationship} · ` : ""}
            {primary.phone}
          </span>
        </a>
      ) : (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          No emergency contact saved.
        </p>
      )}

      <section>
        <h3 className={sectionTitle}>Allergies</h3>
        <ul className="mt-2 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {sortAllergensForCard(card.allergens).map((allergen) => (
            <li key={allergen.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {selectionLabel(allergen)}
              </span>
              {allergen.severity && (
                <span
                  className={
                    allergen.severity === "severe"
                      ? "rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-800 dark:bg-red-950 dark:text-red-200"
                      : "rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }
                >
                  {SEVERITY_LABELS[allergen.severity]}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className={sectionTitle}>Medications</h3>
        {card.medications.length === 0 ? (
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">None saved.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {card.medications.map((med) => (
              <li key={med.id} className="text-base text-zinc-900 dark:text-zinc-50">
                <span className="font-semibold">{med.name}</span>
                {med.dose && <span> · {med.dose}</span>}
                {isExpired(med.expiry_date, today) && (
                  <span className="ml-2 text-sm font-semibold text-red-700 dark:text-red-400">
                    Expired {med.expiry_date}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <h3 className={sectionTitle}>Other contacts</h3>
          <ul className="mt-2 space-y-2">
            {others.map((contact) => (
              <li key={contact.id}>
                <a
                  href={telHref(contact.phone)}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700"
                >
                  <span className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                    Call {contact.name}
                    {contact.relationship && (
                      <span className="font-normal text-zinc-600 dark:text-zinc-400">
                        {" "}
                        ({contact.relationship})
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{contact.phone}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Last updated {formatSyncedAt(card.syncedAt)}
      </p>
    </article>
  );
}
