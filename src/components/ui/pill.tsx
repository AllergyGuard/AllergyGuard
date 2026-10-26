import type { ReactNode } from "react";
import { TONE_BAND, TONE_INK, TONE_OUTLINE, type Tone } from "./tones";

type Props = {
  tone?: Tone;
  /** Emoji or icon before the text; emoji are decorative. */
  icon?: ReactNode;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
};

/** Fully rounded label. Always carries text, so meaning never rests on colour. */
export function Pill({ tone = "primary", icon, size = "md", className = "", children }: Props) {
  const sizing = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-extrabold ${sizing} ${TONE_BAND[tone]} ${TONE_INK[tone]} ${TONE_OUTLINE[tone]} ${className}`}
    >
      {typeof icon === "string" ? <span aria-hidden="true">{icon}</span> : icon}
      {children}
    </span>
  );
}

/** "Coming soon" marker for features that aren't built yet. */
export function ComingSoon() {
  return (
    <Pill tone="neutral" size="sm">
      Coming soon
    </Pill>
  );
}
