# AllergyGuard build progress

Branch: `feature/full-build`, one commit per story/phase, pushed once at the end.
Scope: rest of Phase 1, then Phases 2–8 from `docs/PLAN.md`. Phases 9–10 skipped for now.

To resume in a fresh session: run `/clear`, then say "continue from docs/PROGRESS.md".

## Checklist

### Phase 1: Auth and allergy profile
- [x] US-01 Sign up with email and password (merged in PR #5)
- [ ] US-02 Log in and log out
- [ ] US-07 Allergen selection: reusable `AllergenPicker` (severity + custom allergens)
- [ ] US-03 Onboarding wizard: disclaimer, profile name, allergens, primary emergency contact, medications, resumable
- [ ] US-09 Edit profile, incl. `set_primary_contact(contact_id)` Postgres function (single transaction)

### Later phases
- [ ] Phase 2: Offline emergency card (Serwist, Dexie, `/emergency`, nav button, manifest)
- [ ] Phase 3: Allergen matching engine (`checkAllergens()`)
- [ ] Phase 4: Barcode scanning (@zxing/browser, Open Food Facts, `scans` table)
- [ ] Phase 5: Ingredient label photo (Tesseract.js OCR)
- [ ] Phase 6: Reaction diary
- [ ] Phase 7: Medication expiry reminders (Web Push + Resend, pg_cron)
- [ ] Phase 8: Ingredient change alerts (weekly cron)

## Now
US-02 Log in and log out.

## Next
US-07 AllergenPicker (plan to be shown before starting).

## Follow-ups (not blocking)
- Login: "Resend confirmation email" button for `email_not_confirmed`.

## Manual steps for me
- [ ] **Link the Supabase CLI to the project** (needed before US-09's migration can be applied with `npx supabase db push`):
  ```bash
  npx supabase login
  npx supabase link --project-ref <your-project-ref>
  npx supabase migration list   # the 20260924000000 row should show in both Local and Remote
  ```
  If Remote is blank for `20260924000000` (it was applied via the SQL Editor), run
  `npx supabase migration repair --status applied 20260924000000` so `db push` doesn't re-run it.
- [ ] **Test real login/logout** once US-02 is committed: log in at `/login` with a confirmed account,
  check the header shows "Log out", log out, and check you land on `/login` with the logged-out message.
