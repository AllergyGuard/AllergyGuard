import type { ReactNode } from "react";
import { TONE_ACCENT, TONE_INK, type Tone } from "./tones";

/** Small uppercase, letter-spaced section label in the section's colour. */
export function SectionLabel({
  tone,
  id,
  as: Tag = "h2",
  children,
}: {
  tone: Tone;
  id?: string;
  as?: "h2" | "h3" | "p";
  children: ReactNode;
}) {
  return (
    <Tag id={id} className={`text-xs font-black uppercase tracking-[0.12em] ${TONE_INK[tone]}`}>
      {children}
    </Tag>
  );
}

type Props = {
  tone: Tone;
  /** The coloured label, rendered as a heading. Omit for an unlabeled card. */
  label?: ReactNode;
  labelId?: string;
  labelAs?: "h2" | "h3";
  /** Label inside the card (accent cards) instead of above it. */
  labelInside?: boolean;
  /** 4px coloured left border. */
  accent?: boolean;
  className?: string;
  children: ReactNode;
};

/** White card with a soft shadow, owned by one section colour. */
export function SectionCard({
  tone,
  label,
  labelId,
  labelAs = "h2",
  labelInside = false,
  accent = false,
  className = "",
  children,
}: Props) {
  const labelNode = label ? (
    <SectionLabel tone={tone} id={labelId} as={labelAs}>
      {label}
    </SectionLabel>
  ) : null;
  return (
    <div className="space-y-2">
      {!labelInside && labelNode}
      <div
        className={`rounded-card border border-line bg-card p-4 shadow-card ${
          accent ? `border-l-4 ${TONE_ACCENT[tone]}` : ""
        } ${className}`}
      >
        {labelInside && <div className="mb-2">{labelNode}</div>}
        {children}
      </div>
    </div>
  );
}
