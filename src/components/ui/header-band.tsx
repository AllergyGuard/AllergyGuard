import type { ReactNode, Ref } from "react";
import { TONE_BAND, TONE_INK, type Tone } from "./tones";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Decorative emoji after the title, hidden from screen readers. */
  emoji?: string;
  tone?: Tone;
  /** Centred layout with rounded bottom corners (login, profile, emergency). */
  centered?: boolean;
  /** Shown above the title, e.g. the app icon or an avatar. */
  top?: ReactNode;
  /** Shown to the right of the title. */
  aside?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  children?: ReactNode;
};

/** Full-width pastel block at the top of a screen with the page's <h1>. */
export function HeaderBand({
  title,
  subtitle,
  emoji,
  tone = "primary",
  centered = false,
  top,
  aside,
  headingRef,
  children,
}: Props) {
  return (
    <div className={`${TONE_BAND[tone]} px-4 pb-6 pt-6 ${centered ? "rounded-b-[32px] text-center" : ""}`}>
      <div className="mx-auto w-full max-w-sm">
        {top && <div className={centered ? "mb-3 flex justify-center" : "mb-3"}>{top}</div>}
        <div className={`flex items-start gap-3 ${centered ? "justify-center" : "justify-between"}`}>
          <div className="min-w-0">
            <h1
              ref={headingRef}
              tabIndex={headingRef ? -1 : undefined}
              className={`text-[26px] font-black leading-tight tracking-tight outline-none ${TONE_INK[tone]}`}
            >
              {title}
              {emoji && (
                <span aria-hidden="true" className="ml-2">
                  {emoji}
                </span>
              )}
            </h1>
            {subtitle && <p className="mt-1 text-base font-semibold text-muted">{subtitle}</p>}
          </div>
          {aside}
        </div>
        {children}
      </div>
    </div>
  );
}
