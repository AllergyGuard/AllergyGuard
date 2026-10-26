import type { ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";

/**
 * Wraps an <input> that uses `inputClass` and shows a decorative icon at its
 * right edge (mail, person, phone). Give the input `pr-12` so text doesn't
 * run under the icon.
 */
export function InputWithIcon({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-4 top-1/2 mt-0.5 -translate-y-1/2 text-muted">
        {icon}
      </span>
    </div>
  );
}

/**
 * Eye button inside a password field. Sits over the input's right edge, so the
 * input needs `pr-14`. 44px square; its name stays "Show password" and the
 * pressed state says whether the password is visible.
 */
export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={shown}
      aria-label="Show password"
      className="absolute right-1 top-1/2 mt-0.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-field text-muted hover:text-primary-ink focus-visible:outline-2 focus-visible:outline-primary"
    >
      {shown ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}
