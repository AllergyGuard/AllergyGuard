import { describe, expect, it } from "vitest";
import { advancedStep, resumeStep } from "./onboarding";

const accepted = "2026-09-25T10:00:00Z";
const profile = (onboarding_step: number, extra: Partial<{
  disclaimer_accepted_at: string | null;
  onboarding_completed_at: string | null;
}> = {}) => ({
  disclaimer_accepted_at: accepted,
  onboarding_completed_at: null,
  onboarding_step,
  ...extra,
});

describe("resumeStep", () => {
  it("starts at the disclaimer when there is no profile yet", () => {
    expect(resumeStep({ profile: null, allergenCount: 0 })).toBe(1);
  });

  it("shows the disclaimer again for a profile that never recorded accepting it", () => {
    expect(
      resumeStep({ profile: profile(0, { disclaimer_accepted_at: null }), allergenCount: 0 }),
    ).toBe(1);
  });

  it("resumes at the step after the last completed one", () => {
    expect(resumeStep({ profile: profile(2), allergenCount: 0 })).toBe(3);
    expect(resumeStep({ profile: profile(3), allergenCount: 2 })).toBe(4);
    expect(resumeStep({ profile: profile(4), allergenCount: 1 })).toBe(5);
  });

  it("never resumes before the name step once a profile exists", () => {
    expect(resumeStep({ profile: profile(0), allergenCount: 0 })).toBe(2);
  });

  it("stays on medications if step 5 was saved but not finished", () => {
    expect(resumeStep({ profile: profile(5), allergenCount: 1 })).toBe(5);
  });

  it("sends the user back to allergens if none are saved", () => {
    expect(resumeStep({ profile: profile(4), allergenCount: 0 })).toBe(3);
  });

  it("returns 6 once onboarding is finished", () => {
    expect(
      resumeStep({
        profile: profile(6, { onboarding_completed_at: accepted }),
        allergenCount: 1,
      }),
    ).toBe(6);
  });
});

describe("advancedStep", () => {
  it("moves forward", () => {
    expect(advancedStep(2, 3)).toBe(3);
  });

  it("never moves backwards when an earlier step is re-saved", () => {
    expect(advancedStep(4, 3)).toBe(4);
  });
});
