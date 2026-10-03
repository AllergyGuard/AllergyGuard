"use client";

import { useState } from "react";
import { fieldErrorClass } from "@/components/form-styles";
import { APP_NAME } from "@/lib/constants";
import { StepShell } from "./step-shell";

type Props = {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  onContinue: () => void;
};

// Step 1. The profile doesn't exist yet, so acceptance lives in wizard state
// and is saved with the name in step 2.
export function DisclaimerStep({ accepted, onAcceptedChange, onContinue }: Props) {
  const [error, setError] = useState<string | null>(null);

  return (
    <StepShell
      step={1}
      title="Before you start"
      primaryLabel="Continue"
      onSubmit={() => {
        if (!accepted) {
          setError("Please tick the box to continue.");
          return;
        }
        onContinue();
      }}
    >
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50">
        <p className="font-semibold">{APP_NAME} is an aid, not medical advice.</p>
        <p className="mt-2">
          Product data can be wrong or out of date. Always read the label, and follow your
          doctor&apos;s advice.
        </p>
      </div>
      <div>
        <label className="flex min-h-12 items-start gap-3 text-base text-zinc-900 dark:text-zinc-50">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => {
              onAcceptedChange(e.target.checked);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "disclaimer-error" : undefined}
            className="mt-1 size-5 shrink-0 accent-emerald-700"
          />
          <span>I understand. I&apos;ll always read the label myself.</span>
        </label>
        {error && (
          <p id="disclaimer-error" className={fieldErrorClass}>
            {error}
          </p>
        )}
      </div>
    </StepShell>
  );
}
