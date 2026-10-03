"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { formAlertClass, primaryButtonClass, secondaryButtonClass } from "@/components/form-styles";
import { TOTAL_STEPS } from "@/lib/profile/onboarding";

type Props = {
  step: number;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  primaryLabel: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: () => void;
  onBack?: () => void;
  /** Optional extra action between primary and Back, e.g. "Add later". */
  secondary?: { label: string; onClick: () => void };
};

/** Layout shared by every onboarding step: progress, heading, body, actions. */
export function StepShell({
  step,
  title,
  description,
  children,
  primaryLabel,
  busy = false,
  error,
  onSubmit,
  onBack,
  secondary,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!busy) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Step {step} of {TOTAL_STEPS}
        </p>
        <div
          className="mt-2 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
        >
          <div
            className="h-1.5 rounded-full bg-emerald-700"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900 outline-none dark:text-zinc-50"
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">{description}</p>
        )}
      </div>

      {children}

      {error && (
        <p role="alert" className={formAlertClass}>
          {error}
        </p>
      )}

      <div className="space-y-3">
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Saving…" : primaryLabel}
        </button>
        {secondary && (
          <button
            type="button"
            disabled={busy}
            onClick={secondary.onClick}
            className={secondaryButtonClass}
          >
            {secondary.label}
          </button>
        )}
        {onBack && (
          <button
            type="button"
            disabled={busy}
            onClick={onBack}
            className="h-12 w-full text-base font-medium text-zinc-700 dark:text-zinc-300"
          >
            Back
          </button>
        )}
      </div>
    </form>
  );
}
