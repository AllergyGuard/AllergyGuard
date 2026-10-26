// Colour tones shared by HeaderBand, SectionCard and Pill. Full class strings
// (not built from parts) so Tailwind can find them.

export type Tone =
  | "primary"
  | "allergy"
  | "medication"
  | "contact"
  | "safe"
  | "caution"
  | "unsafe"
  | "neutral";

/** Text colour for labels, accents and pill text. */
export const TONE_INK: Record<Tone, string> = {
  primary: "text-primary-ink",
  allergy: "text-allergy-ink",
  medication: "text-medication-ink",
  contact: "text-contact-ink",
  safe: "text-safe-ink",
  caution: "text-caution-ink",
  unsafe: "text-unsafe-ink",
  neutral: "text-muted",
};

/** Pastel fill for bands and pills. */
export const TONE_BAND: Record<Tone, string> = {
  primary: "bg-band",
  allergy: "bg-allergy-band",
  medication: "bg-medication-band",
  contact: "bg-contact-band",
  safe: "bg-safe-band",
  caution: "bg-caution-band",
  unsafe: "bg-unsafe-band",
  neutral: "bg-page",
};

/** 4px left accent on cards. */
export const TONE_ACCENT: Record<Tone, string> = {
  primary: "border-l-primary-ink",
  allergy: "border-l-allergy-ink",
  medication: "border-l-medication-ink",
  contact: "border-l-contact-ink",
  safe: "border-l-safe-ink",
  caution: "border-l-caution-ink",
  unsafe: "border-l-unsafe-ink",
  neutral: "border-l-line",
};

/** Pill outline, a softer version of the ink. */
export const TONE_OUTLINE: Record<Tone, string> = {
  primary: "border-primary-ink/30",
  allergy: "border-allergy-ink/30",
  medication: "border-medication-ink/30",
  contact: "border-contact-ink/30",
  safe: "border-safe-ink/30",
  caution: "border-caution-ink/30",
  unsafe: "border-unsafe-ink/30",
  neutral: "border-line",
};
