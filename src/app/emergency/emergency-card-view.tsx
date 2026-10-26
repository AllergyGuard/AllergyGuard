"use client";

import { useEffect, useState } from "react";
import { InstallHint } from "@/components/install-hint";
import { allergenEmoji } from "@/components/ui/allergen-emoji";
import { PhoneIcon } from "@/components/ui/icons";
import { Pill } from "@/components/ui/pill";
import { SectionCard } from "@/components/ui/section-card";
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
    return <p className="mt-6 text-base font-semibold text-muted">Loading…</p>;
  }
  if (state.status === "unavailable" || state.cards.length === 0) {
    return (
      <div className="mt-6 space-y-2 rounded-card border border-line bg-card p-4 text-base text-ink shadow-card">
        <p className="font-extrabold">No emergency info saved on this device.</p>
        <p className="text-muted">
          {state.status === "unavailable"
            ? "This browser isn't letting AllergyGuard store data (private browsing can do this)."
            : "Log in while you have internet once, and your allergies, medications and emergency contact are saved here for offline use."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-10">
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
    <article className="space-y-4" aria-labelledby={`card-${card.profileId}`}>
      <h2 id={`card-${card.profileId}`} className="text-2xl font-black text-ink">
        {card.name}
      </h2>

      {/* The call button comes first, above the fold: in an emergency nobody
          should have to scroll for it (the prototype puts it at the bottom). */}
      {primary ? (
        <a
          href={telHref(primary.phone)}
          className="flex min-h-20 w-full items-center justify-center gap-3 rounded-card bg-emergency px-4 py-3 text-center text-white shadow-button"
        >
          <PhoneIcon className="size-7 shrink-0" />
          <span className="flex flex-col">
            <span className="text-xl font-black uppercase tracking-wide">Call {primary.name}</span>
            <span className="text-base font-semibold">
              {primary.relationship ? `${primary.relationship} · ` : ""}
              {primary.phone}
            </span>
          </span>
        </a>
      ) : (
        <p className="rounded-card border border-caution-ink/30 bg-caution-band p-4 text-base font-bold text-caution-ink">
          No emergency contact saved.
        </p>
      )}

      <SectionCard tone="allergy" accent label="Allergies" labelAs="h3" labelInside>
        <ul className="divide-y divide-line">
          {sortAllergensForCard(card.allergens).map((allergen) => (
            <li key={allergen.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <span aria-hidden="true">{allergenEmoji(allergen)}</span>
                {selectionLabel(allergen)}
              </span>
              {allergen.severity && (
                <Pill tone={allergen.severity === "severe" ? "unsafe" : "neutral"} size="sm">
                  {SEVERITY_LABELS[allergen.severity]}
                </Pill>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard tone="medication" accent label="Medications" labelAs="h3" labelInside>
        {card.medications.length === 0 ? (
          <p className="text-base text-muted">None saved.</p>
        ) : (
          <ul className="space-y-2">
            {card.medications.map((med) => (
              <li key={med.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-ink">
                <span aria-hidden="true">💊</span>
                <span className="font-extrabold">{med.name}</span>
                {med.dose && <span className="text-muted">{med.dose}</span>}
                {isExpired(med.expiry_date, today) && (
                  <Pill tone="unsafe" size="sm">
                    Expired {med.expiry_date}
                  </Pill>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {others.length > 0 && (
        <SectionCard tone="contact" accent label="Other contacts" labelAs="h3" labelInside>
          <ul className="space-y-2">
            {others.map((contact) => (
              <li key={contact.id}>
                <a
                  href={telHref(contact.phone)}
                  className="flex min-h-12 items-center gap-3 rounded-field border border-line px-3 py-2"
                >
                  <PhoneIcon className="size-5 shrink-0 text-contact-ink" />
                  <span className="flex-1 text-base font-extrabold text-ink">
                    Call {contact.name}
                    {contact.relationship && (
                      <span className="font-semibold text-muted"> ({contact.relationship})</span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-muted">{contact.phone}</span>
                </a>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <div className="space-y-1 text-center text-sm font-semibold text-muted">
        <p>
          <span aria-hidden="true">🔒 </span>Saved on this device, works offline.
        </p>
        <p>Last updated {formatSyncedAt(card.syncedAt)}</p>
      </div>
    </article>
  );
}
