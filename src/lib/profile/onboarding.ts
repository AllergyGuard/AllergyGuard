// Onboarding wizard steps and resume logic (US-03).

export const ONBOARDING_STEPS = [
  { step: 1, title: "Before you start" },
  { step: 2, title: "Who is this profile for?" },
  { step: 3, title: "Your allergies" },
  { step: 4, title: "Emergency contact" },
  { step: 5, title: "Medications" },
] as const;

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

/** Stored in profiles.onboarding_step when the wizard is complete. */
export const FINISHED_STEP = 6;
export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export type ResumeInput = {
  profile: {
    disclaimer_accepted_at: string | null;
    onboarding_step: number;
    onboarding_completed_at: string | null;
  } | null;
  allergenCount: number;
};

/**
 * Which step to open the wizard on, from what has been saved.
 * Returns 6 when onboarding is finished (the page then goes home).
 */
export function resumeStep({ profile, allergenCount }: ResumeInput): WizardStep {
  // Step 1 happens before the profile exists, so "no profile" means start over.
  if (profile === null) return 1;
  if (profile.onboarding_completed_at !== null) return 6;
  // A profile without a recorded disclaimer (e.g. created before US-03) must see it.
  if (profile.disclaimer_accepted_at === null) return 1;

  const next = Math.min(Math.max(profile.onboarding_step + 1, 2), 5) as WizardStep;
  // Never skip past the allergen step while the profile has no allergens.
  if (next > 3 && allergenCount === 0) return 3;
  return next;
}

/** onboarding_step only moves forward, even if the user goes Back and re-saves. */
export function advancedStep(current: number, completed: number): number {
  return Math.max(current, completed);
}
