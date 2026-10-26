import type { ReactNode } from "react";
import { formAlertClass } from "@/components/form-styles";
import { SectionLabel } from "@/components/ui/section-card";
import type { Tone } from "@/components/ui/tones";

type Props = {
  id: string;
  title: string;
  /** Section colour for the label and the card's left accent. */
  tone: Tone;
  description?: string;
  /** Success message, announced politely. */
  status?: string | null;
  /** Save error, announced as an alert. */
  error?: string | null;
  children: ReactNode;
};

const ACCENT: Partial<Record<Tone, string>> = {
  primary: "border-l-primary-ink",
  allergy: "border-l-allergy-ink",
  medication: "border-l-medication-ink",
  contact: "border-l-contact-ink",
};

/** A card on the /profile page. Each section saves independently. */
export function Section({ id, title, tone, description, status, error, children }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20 space-y-2">
      <SectionLabel tone={tone} id={`${id}-heading`}>
        {title}
      </SectionLabel>
      <div
        className={`space-y-5 rounded-card border border-l-4 border-line bg-card p-4 shadow-card ${ACCENT[tone] ?? ""}`}
      >
        {description && <p className="text-sm font-semibold text-muted">{description}</p>}
        {children}
        <p role="status" className="text-sm font-extrabold text-safe-ink empty:hidden">
          {status ?? ""}
        </p>
        {error && (
          <p role="alert" className={formAlertClass}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
