import type { ReactNode } from "react";
import type { CheckResult, CheckWarning, Verdict } from "@/lib/allergen/check";
import { HeaderBand } from "@/components/ui/header-band";
import { AlertIcon, CheckIcon, XIcon } from "@/components/ui/icons";
import { Pill } from "@/components/ui/pill";
import { SectionCard } from "@/components/ui/section-card";
import type { Tone } from "@/components/ui/tones";
import { highlightSegments } from "./highlight";

// Shared by barcode (Phase 4) and label photo (Phase 5) results. Every verdict
// shows its word and an icon, never colour alone (CLAUDE.md "Verdicts").

const VERDICT: Record<Verdict, { word: string; tone: Tone; icon: ReactNode; subtitle: string }> = {
  unsafe: {
    word: "Unsafe",
    tone: "unsafe",
    icon: <XIcon className="size-10" />,
    subtitle: "One of your allergens was found.",
  },
  caution: {
    word: "Caution",
    tone: "caution",
    icon: <AlertIcon className="size-10" />,
    subtitle: "We can't be sure this is safe for you.",
  },
  safe: {
    word: "Safe",
    tone: "safe",
    icon: <CheckIcon className="size-10" />,
    subtitle: "None of your allergens were found.",
  },
};

export type VerdictProduct = {
  found: boolean;
  name: string | null;
  brands: string | null;
  barcode: string;
};

type Props = {
  result: CheckResult;
  /** Barcode results; null for a label photo. */
  product: VerdictProduct | null;
  /** Reasons the source data may be incomplete. */
  notes?: readonly string[];
  /** ISO time of the check. */
  checkedAt: string;
  /** Data attribution shown at the bottom, e.g. Open Food Facts. */
  attribution?: ReactNode;
  actions: ReactNode;
};

function warningPill(w: CheckWarning): ReactNode {
  switch (w.kind) {
    case "possible_source":
      return `“${w.text}” may contain ${w.allergen}`;
    case "free_from_claim":
      return `Claim: “${w.text}”`;
    case "missing_text":
      return "No ingredient list";
    case "incomplete":
      return "Data may be incomplete";
    case "low_confidence":
      return "Text not read clearly";
    case "no_allergens":
      return "No allergens in your profile";
  }
}

function formatCheckedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export function VerdictView({ result, product, notes = [], checkedAt, attribution, actions }: Props) {
  const v = VERDICT[result.verdict];
  const segments = highlightSegments(result.rawText, result.matches);
  const hasMay = segments.some((s) => s.kind === "may_contain");
  const hasContains = segments.some((s) => s.kind === "contains");

  return (
    <main className="flex flex-1 flex-col bg-page">
      <HeaderBand
        tone={v.tone}
        centered
        title={v.word}
        subtitle={v.subtitle}
        top={
          <span className="flex size-16 items-center justify-center rounded-full bg-card shadow-card" aria-hidden="true">
            <span className={v.tone === "safe" ? "text-safe-ink" : v.tone === "caution" ? "text-caution-ink" : "text-unsafe-ink"}>
              {v.icon}
            </span>
          </span>
        }
      />

      <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-6">
        {product && (
          <SectionCard tone={v.tone} accent>
            <p className="text-lg font-black text-ink">
              {product.name ?? (product.found ? "Unnamed product" : "Product not found")}
            </p>
            {product.brands && <p className="text-sm font-semibold text-muted">{product.brands}</p>}
            <p className="mt-1 text-sm font-semibold text-muted">Barcode {product.barcode}</p>
            {!product.found && (
              <p className="mt-3 rounded-field bg-caution-band p-3 text-sm font-bold text-caution-ink">
                This product isn&apos;t on Open Food Facts, so we have no ingredients to check.
              </p>
            )}
          </SectionCard>
        )}

        <SectionCard tone={v.tone} label={`Why is it ${v.word.toLowerCase()}?`}>
          <p className="text-base font-semibold text-ink">{result.explanation}</p>
          {(result.matches.length > 0 || result.warnings.length > 0) && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="What triggered it">
              {result.matches.map((m, i) => (
                <li key={`m${i}`}>
                  <Pill tone={m.kind === "contains" ? "unsafe" : "caution"} size="sm">
                    {m.allergen}: {m.kind === "contains" ? "" : "may contain "}“{m.text}”
                    {m.source === "declared" ? " (allergen list)" : ""}
                  </Pill>
                </li>
              ))}
              {result.warnings.map((w, i) => (
                <li key={`w${i}`}>
                  <Pill tone="caution" size="sm">
                    {warningPill(w)}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
          {notes.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-muted">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard tone="neutral" label="Ingredients as received">
          {result.rawText.trim() === "" ? (
            <p className="text-base font-semibold text-muted">No ingredient text was available.</p>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-ink">
                {segments.map((s, i) =>
                  s.kind === null ? (
                    <span key={i}>{s.text}</span>
                  ) : (
                    <mark
                      key={i}
                      className={
                        s.kind === "contains"
                          ? "rounded bg-unsafe-band px-0.5 font-black text-unsafe-ink underline decoration-2"
                          : "rounded bg-caution-band px-0.5 font-extrabold text-caution-ink underline decoration-dotted decoration-2"
                      }
                    >
                      {s.text}
                    </mark>
                  ),
                )}
              </p>
              {(hasContains || hasMay) && (
                <p className="mt-3 text-xs font-semibold text-muted">
                  {hasContains && "Solid underline: your allergen. "}
                  {hasMay && "Dotted underline: may contain."}
                </p>
              )}
            </>
          )}
        </SectionCard>

        <div className="space-y-3">{actions}</div>

        <div className="space-y-1 text-center text-xs font-semibold text-muted">
          <p>Checked against your allergies on {formatCheckedAt(checkedAt)}.</p>
          {attribution && <p>{attribution}</p>}
          <p>AllergyGuard is an aid, not medical advice. Always read the label.</p>
        </div>
      </div>
    </main>
  );
}
