-- US-03: resumable onboarding.
--
-- onboarding_step is the last completed wizard step:
--   0 nothing yet, 2 disclaimer + name (profile created), 3 allergens,
--   4 emergency contact (added or skipped), 5 medications, 6 finished.
-- Step 1 (disclaimer) happens before the profile exists; its acceptance is
-- saved as disclaimer_accepted_at when step 2 creates the profile.
-- Existing RLS policies on profiles already cover these columns.

alter table public.profiles
  add column disclaimer_accepted_at  timestamptz,
  add column onboarding_step         smallint not null default 0,
  add column onboarding_completed_at timestamptz;

alter table public.profiles
  add constraint profiles_onboarding_step_range
    check (onboarding_step between 0 and 6),
  -- Finished (step 6) exactly when a completion time is recorded.
  add constraint profiles_onboarding_completed_consistent
    check ((onboarding_step = 6) = (onboarding_completed_at is not null));
